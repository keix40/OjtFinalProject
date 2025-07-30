package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String recipientEmail;
    
    @Enumerated(EnumType.STRING)
    private NotificationTypeEnum userType;

    @Column(columnDefinition = "LONGTEXT")
    private String message;

    @Column(name="seen")
    private boolean read;

    private LocalDateTime timestamp;
    private String type; // e.g., 'success', 'failed', etc.
    private String link; // e.g., '/userproductlist'
    private String category; //e.g., 'discount', 'order', etc.
    private String priority;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
