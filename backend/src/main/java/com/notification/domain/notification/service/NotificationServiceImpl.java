package com.notification.domain.notification.service;

import java.util.List;
import com.notification.domain.notification.dto.NotificationResponse;
import com.notification.domain.notification.dto.MarkReadRequest;
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
        log.info("Broadcasting notification to all users: {}", messageText);
        
        // 1. Save synchronously so we have a valid ID for acknowledgment
        java.time.LocalDateTime istNow = java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
        notificationRepository.insertGlobalNotification(messageText, type.name(), istNow);
        
        // 2. Fetch one of the saved ones to get the structure (or just construct manually with a placeholder ID if needed)
        // For simplicity and zero latency, we can now broadcast a message that the frontend can eventually sync, 
        // but since it's "global", we can use a special indicator or just fetch the latest ID.
        
        NotificationResponse broadcastMsg = NotificationResponse.builder()
                .id(System.currentTimeMillis()) // Using a high-precision timestamp as a pseudo-ID for global broadcast acknowledgement if needed, or zero
                .message(messageText)
                .type(type)
                .read(false)
                .createdAt(istNow)
                .recipient(null)
                .build();
        
        messagingTemplate.convertAndSend("/topic/global", broadcastMsg);
        log.info("Broadcast sent with timestamp: {}", istNow);
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
                .createdAt(java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")))
                .build();
        notificationRepository.save(n);
        messagingTemplate.convertAndSendToUser(u.getEmail(), "/queue/notifications", NotificationMapper.toResponse(n));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "notif_history", 
               key = "'user_' + #email + '_' + (#query ?: 'all') + '_' + #pageable.pageNumber + '_' + #pageable.pageSize")
    public Page<NotificationResponse> getNotificationsForUser(String email, String query, Pageable pageable) {
        log.info("Fetching notifications for user: {}. Query: '{}'", email, query != null ? query : "[ALL]");
        User u = userRepository.findByEmail(email).orElseThrow(() -> new UserNotFoundException(email));
        if (query != null && !query.isBlank()) {
            return notificationRepository.searchNotificationsByKeyword(u, query, pageable)
                    .map(NotificationMapper::toResponse);
        }
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
    @Caching(evict = {
        @CacheEvict(value = "unread_counts", key = "#email", beforeInvocation = true),
        @CacheEvict(value = "notif_history", allEntries = true, beforeInvocation = true)
    })
    public long markAsRead(Long notificationId, String email) {
        log.info("Marking notification {} as read for user {}", notificationId, email);
        User user = userRepository.findByEmail(email).orElseThrow(() -> new UserNotFoundException(email));
        
        Notification n = null;
        if (notificationId != null && notificationId > 0) {
            n = notificationRepository.findById(notificationId).orElse(null);
        }

        // Fallback for transient IDs or global broadcasts: Try finding by message content
        if (n == null) {
            log.info("Notification ID {} not found or invalid. Trying fallback acknowledgment...", notificationId);
            // We'll need the message content. For simplicity, we can't easily get it here 
            // without the request body. Redirecting to the DTO method if we had the body.
            // But since this is the ID-only endpoint, we'll try to find the latest unread for this user 
            // if we had a way. To be truly robust, the frontend should use the new endpoint.
            throw new NotificationException("Notification not found with ID: " + notificationId);
        }
        
        if (!n.getRecipient().getEmail().equals(email)) {
            log.warn("Security Alert: User {} attempted to mark notification {} as read (not the recipient)", email, notificationId);
            throw new NotificationException("Unauthorized: You are not the recipient of this notification");
        }
        
        n.setRead(true);
        notificationRepository.save(n);
        return notificationRepository.countByRecipientAndReadFalse(user);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "unread_counts", key = "#email"),
        @CacheEvict(value = "notif_history", allEntries = true)
    })
    public long markAsRead(MarkReadRequest request, String email) {
        log.info("Processing acknowledgment request for user {}: ID={}, Message Preview={}", 
                email, request.getId(), (request.getMessage() != null ? request.getMessage().substring(0, Math.min(30, request.getMessage().length())) : "null"));
        
        User user = userRepository.findByEmail(email).orElseThrow(() -> new UserNotFoundException(email));
        Notification n = null;

        // 1. Try by ID
        if (request.getId() != null && request.getId() > 0) {
            n = notificationRepository.findById(request.getId()).orElse(null);
        }

        // 2. Fallback: Try by Content (Useful for global broadcasts)
        if (n == null && request.getMessage() != null && !request.getMessage().isBlank()) {
            log.info("ID match failed. Attempting content-based match for global notification...");
            n = notificationRepository.findFirstByRecipientAndMessageAndReadFalseOrderByCreatedAtDesc(user, request.getMessage())
                    .orElse(null);
        }

        if (n != null) {
            if (!n.getRecipient().getEmail().equals(email)) {
                throw new NotificationException("Unauthorized");
            }
            n.setRead(true);
            notificationRepository.save(n);
        } else {
            log.warn("Could not find notification to acknowledge for user {} with ID {} or message content", email, request.getId());
        }

        return notificationRepository.countByRecipientAndReadFalse(user);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "unread_counts", key = "#email", beforeInvocation = true),
        @CacheEvict(value = "notif_history", allEntries = true, beforeInvocation = true)
    })
    public long markAllAsRead(String email) {
        User u = userRepository.findByEmail(email).orElseThrow(() -> new UserNotFoundException(email));
        log.info("Marking all notifications as read for user: {}", email);
        notificationRepository.markAllAsReadByRecipient(u);
        return 0; // After marking all as read, count is always 0
    }

    @Override
    @Cacheable(value = "notif_history", 
               key = "'admin_' + (#query ?: 'all') + '_' + #pageable.pageNumber + '_' + #pageable.pageSize + '_' + #pageable.sort", 
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
