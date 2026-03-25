package com.notification.domain.notification.mapper;

import com.notification.domain.notification.dto.NotificationResponse;
import com.notification.domain.notification.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public static NotificationResponse toResponse(Notification n) {
        if (n == null) return null;
        
        return NotificationResponse.builder()
                .id(n.getId())
                .message(n.getMessage())
                .type(n.getType())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .recipient(NotificationResponse.RecipientDto.builder()
                        .email(n.getRecipient().getEmail())
                        .username(n.getRecipient().getUsername())
                        .build())
                .build();
    }
}
