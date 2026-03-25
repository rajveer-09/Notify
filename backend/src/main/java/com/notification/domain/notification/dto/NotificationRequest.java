package com.notification.domain.notification.dto;

import com.notification.domain.notification.entity.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class NotificationRequest {
    @NotBlank(message = "Notification message cannot be blank")
    private String message;

    @NotNull(message = "Notification type is required")
    private NotificationType type;

    private List<String> targetEmails;

    public NotificationRequest() {}

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    public List<String> getTargetEmails() { return targetEmails; }
    public void setTargetEmails(List<String> targetEmails) { this.targetEmails = targetEmails; }
}
