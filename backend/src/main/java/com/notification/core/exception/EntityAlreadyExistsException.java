package com.notification.core.exception;

public class EntityAlreadyExistsException extends ConflictException {
    public EntityAlreadyExistsException(String message) {
        super(message, "ALREADY_EXISTS");
    }
}
