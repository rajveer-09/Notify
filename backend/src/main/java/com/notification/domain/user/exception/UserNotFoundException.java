package com.notification.domain.user.exception;

import com.notification.core.exception.ResourceNotFoundException;

public class UserNotFoundException extends ResourceNotFoundException {
    public UserNotFoundException(String email) {
        super("User not found with email: " + email, "USER_NOT_FOUND");
    }
    
    public UserNotFoundException(Long id) {
        super("User not found with ID: " + id, "USER_NOT_FOUND");
    }
}
