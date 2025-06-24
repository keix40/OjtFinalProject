package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class RolePermissionLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String action; // e.g., "CREATED", "UPDATED", "DELETED", "ASSIGNED"
    private String targetType; // e.g., "ROLE", "PERMISSION"
    private Long targetId;
    private String targetName;
    private String performedBy;
    private LocalDateTime timestamp;

    @Column(columnDefinition = "TEXT")
    private String details; // JSON or Description
}
