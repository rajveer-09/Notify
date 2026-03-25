package com.notification.domain.notification.exception;

import com.notification.core.exception.BaseException;
import org.springframework.http.HttpStatus;

public class NotificationException extends BaseException {
    public NotificationException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "NOTIFICATION_ERROR");
    }
}
