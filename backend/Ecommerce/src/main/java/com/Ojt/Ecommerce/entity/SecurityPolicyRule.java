package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityPolicyRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String action; // e.g., 'email_alert', 'require_otp', 'ban_ip', etc.
    private int attempts; // Number of failed attempts to trigger
    private int windowMinutes; // Time window in minutes
    @Column(columnDefinition = "TEXT")
    private String extraData; // Optional JSON for extra params
} 