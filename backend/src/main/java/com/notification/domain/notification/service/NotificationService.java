package com.notification.domain.notification.service;

import com.notification.domain.notification.dto.NotificationResponse;
import com.notification.domain.notification.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface NotificationService {
    void sendToAll(String messageText, NotificationType type);
    void sendToDepartment(String department, String messageText, NotificationType type);
    void sendToUser(String email, String messageText, NotificationType type);
    void sendToUsers(List<String> emails, String messageText, NotificationType type);
    
    Page<NotificationResponse> getNotificationsForUser(String email, Pageable pageable);
    long getUnreadCount(String email);
    void markAsRead(Long notificationId, String email);
    void markAllAsRead(String email);
    Page<NotificationResponse> getAllNotifications(String query, Pageable pageable);
}
