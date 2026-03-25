package com.notification.domain.notification.dto;

import com.notification.domain.notification.entity.NotificationType;

import java.time.LocalDateTime;

public class NotificationResponse {
    private Long id;
    private String message;
    private NotificationType type;
    private boolean read;
    private LocalDateTime createdAt;
    private RecipientDto recipient;

    public NotificationResponse() {}

    public static class NotificationResponseBuilder {
        private Long id;
        private String message;
        private NotificationType type;
        private boolean read;
        private LocalDateTime createdAt;
        private RecipientDto recipient;

        public NotificationResponseBuilder id(Long id) { this.id = id; return this; }
        public NotificationResponseBuilder message(String message) { this.message = message; return this; }
        public NotificationResponseBuilder type(NotificationType type) { this.type = type; return this; }
        public NotificationResponseBuilder read(boolean read) { this.read = read; return this; }
        public NotificationResponseBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public NotificationResponseBuilder recipient(RecipientDto recipient) { this.recipient = recipient; return this; }

        public NotificationResponse build() {
            NotificationResponse r = new NotificationResponse();
            r.id = this.id;
            r.message = this.message;
            r.type = this.type;
            r.read = this.read;
            r.createdAt = this.createdAt;
            r.recipient = this.recipient;
            return r;
        }
    }

    public static NotificationResponseBuilder builder() {
        return new NotificationResponseBuilder();
    }

    public static class RecipientDto {
        private String email;
        private String username;

        public RecipientDto() {}

        public static class RecipientDtoBuilder {
            private String email;
            private String username;

            public RecipientDtoBuilder email(String email) { this.email = email; return this; }
            public RecipientDtoBuilder username(String username) { this.username = username; return this; }

            public RecipientDto build() {
                RecipientDto d = new RecipientDto();
                d.email = this.email;
                d.username = this.username;
                return d;
            }
        }

        public static RecipientDtoBuilder builder() {
            return new RecipientDtoBuilder();
        }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public RecipientDto getRecipient() { return recipient; }
    public void setRecipient(RecipientDto recipient) { this.recipient = recipient; }
}
