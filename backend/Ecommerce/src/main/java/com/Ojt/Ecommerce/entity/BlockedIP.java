package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blocked_ips")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockedIP {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ipAddress;

    @Column(nullable = false)
    private LocalDateTime blockedUntil;

    // Optionally store the user email for alerting
    private String userEmail;

    // Reason for block (optional)
    private String reason;
} 