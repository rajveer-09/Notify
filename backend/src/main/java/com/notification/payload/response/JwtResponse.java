package com.notification.payload.response;
import lombok.AllArgsConstructor;
import lombok.Data;
@Data @AllArgsConstructor
public class JwtResponse { private String token; private String username; private String role; }
