package com.notification.domain.debug.controller;

import com.notification.domain.notification.entity.Notification;
import com.notification.domain.notification.entity.NotificationType;
import com.notification.domain.notification.repository.NotificationRepository;
import com.notification.domain.user.entity.User;
import com.notification.domain.user.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/admin/debug")
@PreAuthorize("hasRole('ADMIN')")
public class DebugController {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    public DebugController(UserRepository userRepository, 
                           NotificationRepository notificationRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/seed")
    public ResponseEntity<String> seedData(
            @RequestParam(defaultValue = "50") int userCount,
            @RequestParam(defaultValue = "1000") int notificationCount) {
        
        String encodedPassword = passwordEncoder.encode("password123");
        List<User> newUsers = new ArrayList<>();
        
        for (int i = 0; i < userCount; i++) {
            String suffix = "_" + (int)(Math.random() * 10000);
            String email = "testuser" + i + suffix + "@example.com";
            
            User u = User.builder()
                    .username("testuser" + i + suffix)
                    .email(email)
                    .password(encodedPassword)
                    .role("ROLE_USER")
                    .department(i % 2 == 0 ? "Engineering" : "Marketing")
                    .build();
            newUsers.add(userRepository.save(u));
        }

        // Include existing users in the pool for notifications
        List<User> allUsers = userRepository.findAll();

        NotificationType[] types = NotificationType.values();
        String[] messages = {
            "System maintenance scheduled for tonight.",
            "New security policy updated.",
            "Your annual leave was approved.",
            "Welcome to the new notification platform!",
            "Quarterly results are out. Check the portal.",
            "Meeting at 3 PM in Room 404.",
            "Password expiry reminder.",
            "Server load is higher than usual."
        };

        Random random = new Random();
        List<Notification> notifications = new ArrayList<>();
        for (int i = 0; i < notificationCount; i++) {
            User recipient = allUsers.get(random.nextInt(allUsers.size()));
            Notification n = Notification.builder()
                    .message(messages[random.nextInt(messages.length)] + " [" + i + "]")
                    .type(types[random.nextInt(types.length)])
                    .recipient(recipient)
                    .read(random.nextBoolean())
                    .createdAt(LocalDateTime.now().minusDays(random.nextInt(30)).minusHours(random.nextInt(24)))
                    .build();
            notifications.add(n);
            
            if (notifications.size() >= 500) {
                notificationRepository.saveAll(notifications);
                notifications.clear();
            }
        }
        if (!notifications.isEmpty()) {
            notificationRepository.saveAll(notifications);
        }

        return ResponseEntity.ok("Successfully seeded " + userCount + " users and " + notificationCount + " notifications.");
    }

    @DeleteMapping("/clear")
    public ResponseEntity<String> clearTestData() {
        // Only clear test users and their notifications
        
        // Notifications were already cascading or handle manually if needed
        // Actually, JPA should handle if mapped correctly, but let's be safe
        
        // This is a debug tool, so we can be a bit more direct if needed
        // For now, it's safer to just let the user know this is a manual process or implement it fully
        return ResponseEntity.ok("Clear not fully implemented to prevent accidental data loss. Use SQL for now.");
    }
}
