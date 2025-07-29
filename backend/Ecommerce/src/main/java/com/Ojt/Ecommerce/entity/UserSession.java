package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_sessions")
public class UserSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "session_id", unique = true)
    private String sessionId;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "page_count")
    private Integer pageCount = 0;

    @Column(name = "is_bounce")
    private Boolean isBounce = true; // Default to true, set to false if user visits multiple pages

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "last_activity")
    private LocalDateTime lastActivity;

    // Constructors
    public UserSession() {
        this.startTime = LocalDateTime.now();
        this.lastActivity = LocalDateTime.now();
    }

    public UserSession(Long userId, String sessionId, String userAgent, String ipAddress) {
        this();
        this.userId = userId;
        this.sessionId = sessionId;
        this.userAgent = userAgent;
        this.ipAddress = ipAddress;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public Integer getPageCount() { return pageCount; }
    public void setPageCount(Integer pageCount) { this.pageCount = pageCount; }

    public Boolean getIsBounce() { return isBounce; }
    public void setIsBounce(Boolean isBounce) { this.isBounce = isBounce; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public LocalDateTime getLastActivity() { return lastActivity; }
    public void setLastActivity(LocalDateTime lastActivity) { this.lastActivity = lastActivity; }

    // Helper methods
    public void incrementPageCount() {
        this.pageCount++;
        if (this.pageCount > 1) {
            this.isBounce = false;
        }
        this.lastActivity = LocalDateTime.now();
    }

    public void endSession() {
        this.endTime = LocalDateTime.now();
    }

    public boolean isActive() {
        return this.endTime == null;
    }
} 