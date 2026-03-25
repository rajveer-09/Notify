package com.notification.domain.user.dto;



public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
    private String department;

    public UserResponse() {}

    public UserResponse(Long id, String username, String email, String role, String department) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.department = department;
    }

    public static class UserResponseBuilder {
        private Long id;
        private String username;
        private String email;
        private String role;
        private String department;

        public UserResponseBuilder id(Long id) { this.id = id; return this; }
        public UserResponseBuilder username(String username) { this.username = username; return this; }
        public UserResponseBuilder email(String email) { this.email = email; return this; }
        public UserResponseBuilder role(String role) { this.role = role; return this; }
        public UserResponseBuilder department(String department) { this.department = department; return this; }

        public UserResponse build() {
            return new UserResponse(id, username, email, role, department);
        }
    }

    public static UserResponseBuilder builder() {
        return new UserResponseBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}
