package com.Ojt.Ecommerce.entity;

import com.Ojt.Ecommerce.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "login_attempts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Username entered during the attempt
    private String username;

    // IP address of the client
    private String ipAddress;

    // Country/location details (optional for GeoIP)
    private String location;
    private String countryCode;

    // Device or browser info
    private String userAgent;

    // Time of the attempt
    private LocalDateTime timestamp;

    // Success, failed, blocked, etc.
    private String status;

    // Low, medium, high, critical
    private String threatLevel;

    // Number of attempts in a given time
    private Integer attemptCount;

    // For grouping attempts
    private String timeframe;

    // Optional: threat score (e.g., 85/100)
    private Integer threatScore;

    // Whether it’s flagged as VPN or proxy
    private boolean isVPN;
    private boolean isProxy;

    // Optional: block status (used in frontend to disable button)
    private boolean isBlocked;

    // Optional: for session tracking
    private String sessionId;

    // Relationship to user (optional, if exists)
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
