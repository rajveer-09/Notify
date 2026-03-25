package com.notification.domain.user.exception;

import com.notification.core.exception.BaseException;
import org.springframework.http.HttpStatus;

public class UserNotFoundException extends BaseException {
    public UserNotFoundException(String email) {
        super("User not found with email: " + email, HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
    }
    
    public UserNotFoundException(Long id) {
        super("User not found with ID: " + id, HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
    }
}
