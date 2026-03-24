package com.notification.repository;

import com.notification.entity.Notification;
import com.notification.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);
    
    long countByRecipientAndReadFalse(User recipient);
    
    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient = :recipient")
    void markAllAsReadByRecipient(@Param("recipient") User recipient);

    List<Notification> findAllByOrderByCreatedAtDesc();
}
