package com.notification.controller;

import com.notification.payload.request.NotificationRequest;
import com.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
public class AdminController {

    private final NotificationService notificationService;

    @PostMapping("/broadcast")
    public ResponseEntity<?> broadcastToAll(@RequestBody NotificationRequest request) {
        notificationService.sendToAll(request.getMessage(), request.getType());
        return ResponseEntity.ok("Broadcasted successfully");
    }

    @PostMapping("/user/{username}")
    public ResponseEntity<?> sendToUser(@PathVariable("username") String username, @RequestBody NotificationRequest request) {
        notificationService.sendToUser(username, request.getMessage(), request.getType());
        return ResponseEntity.ok("Sent to user successfully");
    }

    @PostMapping("/department/{department}")
    public ResponseEntity<?> sendToDepartment(@PathVariable("department") String department, @RequestBody NotificationRequest request) {
        notificationService.sendToDepartment(department, request.getMessage(), request.getType());
        return ResponseEntity.ok("Sent to department successfully");
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(notificationService.getAllUsers());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable("id") Long id, @RequestBody com.notification.entity.User user) {
        notificationService.updateUser(id, user);
        return ResponseEntity.ok("User updated successfully");
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable("id") Long id) {
        notificationService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully");
    }
}
