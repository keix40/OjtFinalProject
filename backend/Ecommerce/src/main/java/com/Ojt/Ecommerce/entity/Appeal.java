package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "appeals")
public class Appeal {
    @Id
    private String id;

    @Column
    private String blacklistEntryId;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AppealReason appealReason;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String appealDetails;

    @Column(nullable = false)
    private String contactEmail;

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AppealStatus status = AppealStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String adminNotes;

    private LocalDateTime reviewedAt;

    private String reviewedBy;

    public enum AppealReason {
        WRONGFUL_BAN,
        MISTAKEN_IDENTITY,
        ACCOUNT_COMPROMISED,
        TECHNICAL_ERROR,
        OTHER
    }

    public enum AppealStatus {
        PENDING,
        APPROVED,
        REJECTED
    }
}