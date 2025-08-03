package com.Ojt.Ecommerce.dto;

import com.Ojt.Ecommerce.entity.Notification;
import com.Ojt.Ecommerce.entity.NotificationTypeEnum;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationDTO {
    private Long id;
    private String recipientEmail;
    private String userType; // Changed from NotificationTypeEnum to String
    private String message;
    private boolean read;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    
    private String type;
    private String link;
    private String category;
    private String priority;
    
    // Only include user email, not the full user object to avoid circular reference
    private String userEmail;

    public NotificationDTO(Notification notification) {
        this.id = notification.getId();
        this.recipientEmail = notification.getRecipientEmail();
        this.userType = notification.getUserType() != null ? notification.getUserType().name() : null; // Convert enum to string
        this.message = notification.getMessage();
        this.read = notification.isRead();
        this.timestamp = notification.getTimestamp();
        this.type = notification.getType();
        this.link = notification.getLink();
        this.category = notification.getCategory();
        this.priority = notification.getPriority();
        this.userEmail = notification.getUser() != null ? notification.getUser().getEmail() : null;
    }
}
