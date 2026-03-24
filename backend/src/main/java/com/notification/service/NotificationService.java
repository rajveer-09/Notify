package com.notification.service;

import com.notification.entity.Notification;
import com.notification.entity.NotificationType;
import com.notification.entity.User;
import com.notification.repository.NotificationRepository;
import com.notification.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void sendToAll(String messageText, NotificationType type) {
        List<User> users = userRepository.findAll();
        for (User u : users) {
             Notification n = Notification.builder()
                .message(messageText)
                .type(type)
                .recipient(u)
                .read(false)
                .build();
             notificationRepository.save(n);
             
             // Send specifically to each user queue for private tracking using email as identifier
             messagingTemplate.convertAndSendToUser(u.getEmail(), "/queue/notifications", n);
        }
    }

    @Transactional
    public void sendToDepartment(String department, String messageText, NotificationType type) {
        List<User> users = userRepository.findByDepartment(department);
        for (User u : users) {
            Notification n = Notification.builder()
                    .message(messageText)
                    .type(type)
                    .recipient(u)
                    .read(false)
                    .build();
            notificationRepository.save(n);
            messagingTemplate.convertAndSendToUser(u.getEmail(), "/queue/notifications", n);
        }
    }

    @Transactional
    public void sendToUser(String username, String messageText, NotificationType type) {
        User u = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
        Notification n = Notification.builder()
                .message(messageText)
                .type(type)
                .recipient(u)
                .read(false)
                .build();
        notificationRepository.save(n);
        messagingTemplate.convertAndSendToUser(u.getEmail(), "/queue/notifications", n);
    }

    public List<Notification> getNotificationsForUser(String username) {
        User u = userRepository.findByUsername(username).orElseThrow();
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(u);
    }

    public long getUnreadCount(String username) {
        User u = userRepository.findByUsername(username).orElseThrow();
        return notificationRepository.countByRecipientAndReadFalse(u);
    }

    @Transactional
    public void markAsRead(Long notificationId, String username) {
        Notification n = notificationRepository.findById(notificationId).orElseThrow();
        if(!n.getRecipient().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllAsRead(String username) {
        User u = userRepository.findByUsername(username).orElseThrow();
        notificationRepository.markAllAsReadByRecipient(u);
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public void updateUser(Long id, User details) {
        User user = userRepository.findById(id).orElseThrow();
        user.setUsername(details.getUsername());
        user.setEmail(details.getEmail());
        user.setRole(details.getRole());
        user.setDepartment(details.getDepartment());
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        notificationRepository.deleteAll(notificationRepository.findByRecipientOrderByCreatedAtDesc(userRepository.findById(id).orElseThrow()));
        userRepository.deleteById(id);
    }
}
