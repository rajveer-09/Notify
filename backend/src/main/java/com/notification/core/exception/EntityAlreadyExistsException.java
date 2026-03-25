package com.notification.core.exception;

import org.springframework.http.HttpStatus;

public class EntityAlreadyExistsException extends BaseException {
    public EntityAlreadyExistsException(String message) {
        super(message, HttpStatus.CONFLICT, "ALREADY_EXISTS");
    }
}
