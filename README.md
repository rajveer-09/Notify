# Notifiy - Real-Time Notification System

Notifiy is a modern, high-performance real-time notification system built with Spring Boot and Angular. It features a robust backend handling complex notification logic and a sleek, responsive frontend for an optimal user experience.

## 🚀 Features

- **Real-Time Delivery**: Instant notifications powered by WebSocket (STOMP).
- **Multi-Level Targeting**:
  - **Global**: Broadcast messages to all connected users.
  - **Departmental**: Target specific groups (e.g., "Engineering", "Sales").
  - **Individual**: Direct secure messaging to specific users.
- **Admin Dashboard**: Comprehensive management of users and notification history.
- **Optimistic UI**: Instant feedback on "Mark as Read" operations with background synchronization.
- **Standardized Error Handling**: Detailed, consistent error responses across all API endpoints.
- **High Performance**: Optimized with Caffeine caching and indexed database lookups.
- **Role-Based Access (RBAC)**: Secure access control for users and admins.

## 🛠️ Tech Stack

### Backend
- **Framework**: Spring Boot 3.2.4
- **Language**: Java 17
- **Security**: Spring Security with JWT (JSON Web Token)
- **Real-Time**: Spring WebSocket with STOMP & SockJS
- **Database**: MySQL with Spring Data JPA & Hibernate
- **Caching**: Caffeine Cache
- **Documentation**: Detailed Global Exception Handling (RFC 7807 compliant logic)

### Frontend
- **Framework**: Angular 17
- **Style**: Modern Vanilla CSS with responsive design
- **State Management**: Reactive programming with RxJS
- **Real-Time**: StompJS & SockJS client

## 📋 Prerequisites

- **Java**: JDK 17 or higher
- **Node.js**: v18.x or higher
- **Maven**: (Included via IDE or separate installation)
- **MySQL**: v8.0 or higher

## ⚙️ Setup & Installation

### 1. Database Configuration
The project is configured to work with a MySQL database. By default, it uses a Railway-hosted database, but you can configure a local instance in `backend/src/main/resources/application.properties`:
```properties
# Example for local development
spring.datasource.url=jdbc:mysql://localhost:3306/notification_db
spring.datasource.username=root
spring.datasource.password=your_password
```

### 2. Backend Setup
Navigate to the backend directory and run the application using Maven (IntelliJ's bundled Maven can be used if `mvn` is not in the system path):
```bash
cd backend
mvn spring-boot:run
```
*Note: The backend runs on port 8081 by default. Compilation issues (like missing builders) are handled by clean builds.*

### 3. Frontend Setup
Navigate to the frontend directory and install dependencies:
```bash
cd frontend
npm install
npm start
```
*Note: The frontend runs on port 4200 by default and is permitted by backend CORS settings.*

## 📂 Project Structure

```text
Notifiy/
├── backend/                # Spring Boot Application
│   ├── src/main/java/com/notification/
│   │   ├── core/           # Security, Config, Exception Handling
│   │   └── domain/         # Auth, User, Notification modules
│   └── src/main/resources/ # Application properties & resources
├── frontend/               # Angular Application
│   ├── src/app/
│   │   ├── core/           # Guards, Interceptors, Services
│   │   ├── features/       # Feature modules (Admin, Login, Dashboard)
│   │   └── shared/         # Reusable components
└── README.md
```

## 🔐 API Endpoints (Brief)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | POST | Public | Register a new user |
| `/api/auth/login` | POST | Public | Authenticate and get JWT |
| `/api/notifications` | GET | USER | Fetch user's notifications |
| `/api/admin/users` | GET | ADMIN | List all system users |
| `/api/admin/notifications/send` | POST | ADMIN | Send targeted notifications |

## 📝 License
This project is for demonstration purposes and is ready for further development.
