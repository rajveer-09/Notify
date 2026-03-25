package com.notification.domain.auth;

import com.notification.core.exception.EntityAlreadyExistsException;
import com.notification.domain.auth.dto.AuthResponse;
import com.notification.domain.auth.dto.LoginRequest;
import com.notification.domain.auth.dto.RegisterRequest;
import com.notification.domain.user.entity.User;
import com.notification.domain.user.repository.UserRepository;
import com.notification.domain.user.exception.UserNotFoundException;
import com.notification.core.security.JwtUtil;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthServiceImpl.class);
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(AuthenticationManager authenticationManager, UserRepository userRepository,
                           PasswordEncoder encoder, JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        log.debug("Attempting to authenticate user: {}", loginRequest.getEmail());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UserNotFoundException(userDetails.getUsername()));

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        log.info("User authenticated successfully: {}", user.getEmail());
        return new AuthResponse(token, user.getUsername(), user.getRole());
    }

    @Override
    @Transactional
    public void register(RegisterRequest registerRequest) {
        log.debug("Attempting to register user: {}", registerRequest.getEmail());
        
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            log.warn("Registration failed: Username {} already exists", registerRequest.getUsername());
            throw new EntityAlreadyExistsException("Username is already taken");
        }
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            log.warn("Registration failed: Email {} already exists", registerRequest.getEmail());
            throw new EntityAlreadyExistsException("Email is already in use");
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(encoder.encode(registerRequest.getPassword()))
                .role(registerRequest.getRole() != null ? registerRequest.getRole() : "ROLE_USER")
                .department(registerRequest.getDepartment())
                .build();

        userRepository.save(user);
        log.info("User registered successfully: {}", user.getEmail());
    }
}
