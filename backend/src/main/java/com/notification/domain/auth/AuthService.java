package com.notification.domain.auth;

import com.notification.domain.auth.dto.AuthResponse;
import com.notification.domain.auth.dto.LoginRequest;
import com.notification.domain.auth.dto.RegisterRequest;

public interface AuthService {
    AuthResponse login(LoginRequest loginRequest);
    void register(RegisterRequest registerRequest);
}
