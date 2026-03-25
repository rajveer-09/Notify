package com.notification.domain.notification.controller;

import com.notification.domain.notification.dto.NotificationRequest;
import com.notification.domain.notification.dto.NotificationResponse;
import com.notification.domain.notification.service.NotificationService;
import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final NotificationService notificationService;

    public AdminNotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/send")
    public ResponseEntity<Void> sendNotification(@Valid @RequestBody NotificationRequest request) {
        if (request.getTargetEmails() == null || request.getTargetEmails().isEmpty()) {
            notificationService.sendToAll(request.getMessage(), request.getType());
        } else if (request.getTargetEmails().size() == 1) {
            notificationService.sendToUser(request.getTargetEmails().get(0), request.getMessage(), request.getType());
        } else {
            notificationService.sendToUsers(request.getTargetEmails(), request.getMessage(), request.getType());
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/broadcast")
    public ResponseEntity<String> broadcast(@RequestBody NotificationRequest request) {
        notificationService.sendToAll(request.getMessage(), request.getType());
        return ResponseEntity.ok("Broadcast successful");
    }

    @PostMapping("/direct")
    public ResponseEntity<String> sendDirect(@RequestBody NotificationRequest request) {
        notificationService.sendToUsers(request.getTargetEmails(), request.getMessage(), request.getType());
        return ResponseEntity.ok("Direct messages sent");
    }

    @PostMapping("/department/{dept}")
    public ResponseEntity<String> sendToDept(@PathVariable("dept") String dept, @RequestBody NotificationRequest request) {
        notificationService.sendToDepartment(dept, request.getMessage(), request.getType());
        return ResponseEntity.ok("Department messages sent");
    }

    @PostMapping("/user/{email}")
    public ResponseEntity<String> sendToUser(@PathVariable("email") String email, @RequestBody NotificationRequest request) {
        notificationService.sendToUser(email, request.getMessage(), request.getType());
        return ResponseEntity.ok("Direct message sent");
    }

    @GetMapping({"/history", "/all"})
    public ResponseEntity<Page<NotificationResponse>> getHistory(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(notificationService.getAllNotifications(q, pageable));
    }
}
