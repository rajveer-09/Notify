package com.notification.domain.user.mapper;

import com.notification.domain.user.dto.UserResponse;
import com.notification.domain.user.entity.User;

public class UserMapper {
    public static UserResponse toResponse(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .department(user.getDepartment())
                .build();
    }
}
