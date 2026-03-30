package com.notification.domain.notification.repository;

import com.notification.domain.notification.entity.Notification;
import com.notification.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.EntityGraph;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    @EntityGraph(attributePaths = {"recipient"})
    Page<Notification> findByRecipient(User recipient, Pageable pageable);

    @EntityGraph(attributePaths = {"recipient"})
    @Query("SELECT n FROM Notification n WHERE n.recipient = :recipient AND n.message LIKE CONCAT('%', :q, '%')")
    Page<Notification> searchNotificationsByKeyword(@Param("recipient") User recipient, @Param("q") String q, Pageable pageable);
    
    long countByRecipientAndReadFalse(User recipient);
    
    java.util.Optional<Notification> findFirstByRecipientAndMessageAndReadFalseOrderByCreatedAtDesc(User recipient, String message);
    
    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient = :recipient")
    void markAllAsReadByRecipient(@Param("recipient") User recipient);

    @Override
    @EntityGraph(attributePaths = {"recipient"})
    Page<Notification> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"recipient"})
    Page<Notification> findByMessageContainingIgnoreCaseOrRecipientEmailContainingIgnoreCase(String message, String email, Pageable pageable);

    @Modifying
    @Query(value = "INSERT INTO notifications (message, type, recipient_id, is_read, created_at) " +
                   "SELECT :message, :type, id, false, :createdAt FROM users", nativeQuery = true)
    void insertGlobalNotification(@Param("message") String message, @Param("type") String type, @Param("createdAt") java.time.LocalDateTime createdAt);
}
