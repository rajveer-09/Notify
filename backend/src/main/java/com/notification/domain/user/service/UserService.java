package com.notification.domain.user.service;

import com.notification.domain.user.dto.UserResponse;
import com.notification.domain.user.dto.UserUpdateDto;
import com.notification.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    Page<UserResponse> getAllUsers(Pageable pageable);
    Page<UserResponse> searchUsers(String query, Pageable pageable);
    UserResponse getUserByEmail(String email);
    void updateUser(Long id, UserUpdateDto details);
    void deleteUser(Long id);
    User getEntityByEmail(String email);
}
