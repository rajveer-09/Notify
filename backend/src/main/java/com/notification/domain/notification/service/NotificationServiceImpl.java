package com.notification.domain.notification.service;

import java.util.List;
import com.notification.domain.notification.dto.NotificationResponse;
import com.notification.domain.notification.entity.Notification;
import com.notification.domain.notification.entity.NotificationType;
import com.notification.domain.notification.exception.NotificationException;
import com.notification.domain.notification.repository.NotificationRepository;
import com.notification.domain.notification.mapper.NotificationMapper;
import com.notification.domain.user.entity.User;
import com.notification.domain.user.repository.UserRepository;
import com.notification.domain.user.exception.UserNotFoundException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NotificationServiceImpl.class);
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationServiceImpl(NotificationRepository notificationRepository, UserRepository userRepository,
                                   SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    @Transactional
    @CacheEvict(value = {"unread_counts", "notif_history"}, allEntries = true)
    public void sendToAll(String messageText, NotificationType type) {
        try {
            log.info("Sending broadcast notification to all users: {}", messageText);
            userRepository.findAll().forEach(u -> sendInternal(u, messageText, type));
        } catch (Exception e) {
            log.error("Failed to send broadcast notification", e);
            throw e;
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = {"unread_counts", "notif_history"}, allEntries = true)
    public void sendToDepartment(String department, String messageText, NotificationType type) {
        log.info("Sending notification to department [{}]: {}", department, messageText);
        userRepository.findByDepartment(department).forEach(u -> sendInternal(u, messageText, type));
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "unread_counts", key = "#email"),
        @CacheEvict(value = "notif_history", allEntries = true)
    })
    public void sendToUser(String email, String messageText, NotificationType type) {
        User u = userRepository.findByEmail(email).orElseThrow(() -> new UserNotFoundException(email));
        log.info("Sending direct notification to {}: {}", email, messageText);
        sendInternal(u, messageText, type);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "unread_counts", allEntries = true),
        @CacheEvict(value = "notif_history", allEntries = true)
    })
    public void sendToUsers(List<String> emails, String messageText, NotificationType type) {
        if (emails == null || emails.isEmpty()) {
            log.warn("Attempted to send batch notification with no recipients");
            return;
        }
        try {
            log.info("Sending notification to batch of {} users", emails.size());
            userRepository.findAllByEmailIn(emails).forEach(u -> sendInternal(u, messageText, type));
        } catch (Exception e) {
            log.error("Failed to send batch notifications", e);
            throw e;
        }
    }

    private void sendInternal(User u, String messageText, NotificationType type) {
        Notification n = Notification.builder()
                .message(messageText)
                .type(type)
                .recipient(u)
                .read(false)
                .build();
        notificationRepository.save(n);
        messagingTemplate.convertAndSendToUser(u.getEmail(), "/queue/notifications", NotificationMapper.toResponse(n));
    }

    @Override
    public Page<NotificationResponse> getNotificationsForUser(String email, Pageable pageable) {
        User u = userRepository.findByEmail(email).orElseThrow(() -> new UserNotFoundException(email));
        return notificationRepository.findByRecipient(u, pageable)
                .map(NotificationMapper::toResponse);
    }

    @Override
    @Cacheable(value = "unread_counts", key = "#email")
    public long getUnreadCount(String email) {
        User u = userRepository.findByEmail(email).orElseThrow(() -> new UserNotFoundException(email));
        return notificationRepository.countByRecipientAndReadFalse(u);
    }

    @Override
    @Transactional
    @CacheEvict(value = "unread_counts", key = "#email")
    public void markAsRead(Long notificationId, String email) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotificationException("Notification not found with ID: " + notificationId));
        
        if (!n.getRecipient().getEmail().equals(email)) {
            log.warn("Security Alert: User {} attempted to mark notification {} as read (not the recipient)", email, notificationId);
            throw new NotificationException("Unauthorized: You are not the recipient of this notification");
        }
        
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Override
    @Transactional
    @CacheEvict(value = "unread_counts", key = "#email")
    public void markAllAsRead(String email) {
        User u = userRepository.findByEmail(email).orElseThrow(() -> new UserNotFoundException(email));
        log.info("Marking all notifications as read for user: {}", email);
        notificationRepository.markAllAsReadByRecipient(u);
    }

    @Override
    @Cacheable(value = "notif_history", 
               key = "#pageable.pageNumber + '-' + #pageable.pageSize", 
               condition = "#query == null or #query.isEmpty()")
    public Page<NotificationResponse> getAllNotifications(String query, Pageable pageable) {
        log.info("Fetching notification history. Search Query: [{}], Page: {}", query, pageable.getPageNumber());
        if (query == null || query.isBlank()) {
            return notificationRepository.findAll(pageable)
                    .map(NotificationMapper::toResponse);
        }
        return notificationRepository.findByMessageContainingIgnoreCaseOrRecipientEmailContainingIgnoreCase(query, query, pageable)
                .map(NotificationMapper::toResponse);
    }
}
