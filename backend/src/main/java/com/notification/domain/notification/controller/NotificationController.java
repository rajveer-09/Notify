package com.notification.domain.notification.controller;

import com.notification.domain.notification.dto.NotificationResponse;
import com.notification.domain.notification.dto.MarkReadRequest;
import com.notification.domain.notification.service.NotificationService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getMyNotifications(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(value = "q", required = false) String query,
            Authentication authentication) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(authentication.getName(), query, pageable));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(Authentication authentication) {
        return ResponseEntity.ok(notificationService.getUnreadCount(authentication.getName()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Long> markAsRead(@PathVariable("id") Long id, Authentication authentication) {
        return ResponseEntity.ok(notificationService.markAsRead(id, authentication.getName()));
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NotificationController.class);

    @PutMapping("/mark-read")
    public ResponseEntity<Long> markAsRead(@RequestBody MarkReadRequest request, Authentication authentication) {
        log.info("Marking as read: id={}, message={} for user={}", request.getId(), request.getMessage(), authentication.getName());
        return ResponseEntity.ok(notificationService.markAsRead(request, authentication.getName()));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Long> markAllAsRead(Authentication authentication) {
        return ResponseEntity.ok(notificationService.markAllAsRead(authentication.getName()));
    }
}
