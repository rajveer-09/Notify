package com.notification.domain.user.service;

import com.notification.domain.user.dto.UserResponse;
import com.notification.domain.user.dto.UserUpdateDto;
import com.notification.domain.user.entity.User;
import com.notification.domain.user.repository.UserRepository;
import com.notification.domain.user.mapper.UserMapper;
import com.notification.domain.user.exception.UserNotFoundException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(UserServiceImpl.class);
    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Page<UserResponse> searchUsers(String query, Pageable pageable) {
        log.debug("Searching users with query: {}", query);
        return userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query, pageable)
                .map(UserMapper::toResponse);
    }

    @Override
    @Cacheable(value = "users", key = "#pageable != null ? #pageable.pageNumber + '-' + #pageable.pageSize : 'default'")
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        log.debug("Fetching all users, page: {}", pageable.getPageNumber());
        return userRepository.findAll(pageable)
                .map(UserMapper::toResponse);
    }

    @Override
    public UserResponse getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(UserMapper::toResponse)
                .orElseThrow(() -> new UserNotFoundException(email));
    }

    @Override
    public User getEntityByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    @Override
    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public void updateUser(Long id, UserUpdateDto details) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        
        log.info("Updating user [{}]: {} -> {}", id, user.getEmail(), details.getEmail());
        user.setUsername(details.getUsername());
        user.setEmail(details.getEmail());
        user.setRole(details.getRole());
        user.setDepartment(details.getDepartment());
        userRepository.save(user);
    }

    @Override
    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        log.info("Deleting user with ID: {}", id);
        userRepository.deleteById(id);
    }
}
