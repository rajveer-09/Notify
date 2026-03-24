package com.notification.payload.request;
import com.notification.entity.NotificationType;
import lombok.Data;
@Data public class NotificationRequest { private String message; private NotificationType type; }
