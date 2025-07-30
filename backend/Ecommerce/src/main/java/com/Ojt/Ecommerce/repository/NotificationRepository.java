package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification,Long> {
    List<Notification> findByRecipientEmail(String recipientEmail);
    Optional<Notification> findFirstByRecipientEmailAndMessageAndReadFalse(String recipientEmail, String message);
    boolean existsByRecipientEmailAndType(String email, String type);
    Notification findTopByRecipientEmailAndTypeOrderByTimestampDesc(String email, String type);
    
    // Admin notification methods
    List<Notification> findByRecipientEmailIn(List<String> recipientEmails);
    List<Notification> findByRecipientEmailInAndType(List<String> recipientEmails, String type);
    List<Notification> findByRecipientEmailInAndReadFalse(List<String> recipientEmails);
    Page<Notification> findByRecipientEmailIn(List<String> recipientEmails, Pageable pageable);
    List<Notification> findByRecipientEmailInAndTimestampBetween(List<String> recipientEmails, LocalDateTime startDate, LocalDateTime endDate);
    
    // Count methods for statistics
    long countByRecipientEmailIn(List<String> recipientEmails);
    long countByRecipientEmailInAndReadFalse(List<String> recipientEmails);
    long countByRecipientEmailInAndTimestampAfter(List<String> recipientEmails, LocalDateTime timestamp);
    
    // Mark as read methods
    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipientEmail IN :recipientEmails AND n.read = false")
    int markAllAsReadByRecipientEmailIn(@Param("recipientEmails") List<String> recipientEmails);
    
    // Additional admin notification methods
    List<Notification> findByRecipientEmailInAndTypeAndReadFalse(List<String> recipientEmails, String type);
    List<Notification> findByRecipientEmailInOrderByTimestampDesc(List<String> recipientEmails);
    List<Notification> findByRecipientEmailInAndTimestampAfter(List<String> recipientEmails, LocalDateTime timestamp);
    
    // Delete methods
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.recipientEmail IN :recipientEmails AND n.id = :notificationId")
    int deleteByRecipientEmailInAndId(@Param("recipientEmails") List<String> recipientEmails, @Param("notificationId") Long notificationId);

     // New methods for role-based filtering
     List<Notification> findByRecipientEmailInAndCategory(List<String> emails, String category);

}
