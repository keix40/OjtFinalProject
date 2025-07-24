package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RolePermissionLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String action;
    private String targetType;
    private Long targetId;
    private String targetName;
    private String performedBy;
    private LocalDateTime timestamp;
    @Column(columnDefinition = "TEXT")
    private String details;
}
