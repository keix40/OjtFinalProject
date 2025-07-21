package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification,Long> {
    List<Notification> findByRecipientEmail(String recipientEmail);
    Optional<Notification> findFirstByRecipientEmailAndMessageAndReadFalse(String recipientEmail, String message);
    boolean existsByRecipientEmailAndType(String email, String type);
    Notification findTopByRecipientEmailAndTypeOrderByTimestampDesc(String email, String type);
}
