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

    @Column(columnDefinition = "LONGTEXT")
    private String message;

    @Column(name="seen")
    private boolean read;

    private LocalDateTime timestamp;

}
