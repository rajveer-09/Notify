package com.notification.domain.notification.service;

import com.notification.domain.notification.repository.NotificationRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AsyncNotificationService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AsyncNotificationService.class);
    private final NotificationRepository notificationRepository;

    public AsyncNotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Async
    @Transactional
    public void saveGlobalNotificationBackground(String message, String type) {
        try {
            log.info("Starting background archival for global notification: {}", message);
            java.time.LocalDateTime istNow = java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
            notificationRepository.insertGlobalNotification(message, type, istNow);
            log.info("Background archival completed successfully with timestamp: {}", istNow);
        } catch (Exception e) {
            log.error("Failed to archive global notification in background", e);
        }
    }
}
