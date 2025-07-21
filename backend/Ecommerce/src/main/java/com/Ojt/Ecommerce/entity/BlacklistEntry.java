package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "blacklist_entries")
public class BlacklistEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TargetType targetType;

    @Column(nullable = false)
    private String targetValue;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Category category;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private LocalDateTime addedDate;

    @Column(nullable = false)
    private String addedBy;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime expiryDate;

    private String associatedEmail;

    private String deviceFingerprint;

    @Column(nullable = false)
    private int incidentCount;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private boolean isAutomatic;

    @Column(nullable = false)
    private LocalDateTime lastIncidentDate;

    public enum TargetType {
        EMAIL, IP, DEVICE, PHONE, USER_ID
    }

    public enum Category {
        FRAUD, SPAM, ABUSE, CHARGEBACK, FAKE_ACCOUNT, POLICY_VIOLATION
    }

    public enum RiskLevel {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum Status {
        ACTIVE, APPEALED, EXPIRED, LIFTED
    }
}