package com.Ojt.Ecommerce.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAttemptDTO {

    private Long id;
    private String username;
    private String ipAddress;
    private String location;
    private String countryCode;
    private String userAgent;
    private LocalDateTime timestamp;
    private String status;
    private String threatLevel;
    private Integer attemptCount;
    private String timeframe;
    private Integer threatScore;
    private boolean isVPN;
    private boolean isProxy;
    private boolean isBlocked;
    private String sessionId;
    private Long userId; // used instead of full User object
}
