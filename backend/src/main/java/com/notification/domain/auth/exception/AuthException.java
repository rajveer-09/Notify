package com.notification.domain.auth.exception;

import com.notification.core.exception.BaseException;
import org.springframework.http.HttpStatus;

public class AuthException extends BaseException {
    public AuthException(String message) {
        super(message, HttpStatus.UNAUTHORIZED, "AUTH_ERROR");
    }
}
