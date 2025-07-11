package com.Ojt.Ecommerce.dto;

import java.time.LocalDateTime;

public class CustomerSummaryDTO {
    private Long userId;
    private String name;
    private String email;
    private String phoneNumber;
    private String status;
    private String roleName;
    private LocalDateTime joinDate;
    private Integer totalOrders;
    private Double totalSpent;
    private String profileImage;

    public CustomerSummaryDTO(Long userId, String name, String email, String phoneNumber, String status, String roleName, LocalDateTime joinDate, Integer totalOrders, Double totalSpent, String profileImage) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.status = status;
        this.roleName = roleName;
        this.joinDate = joinDate;
        this.totalOrders = totalOrders;
        this.totalSpent = totalSpent;
        this.profileImage = profileImage;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
    public LocalDateTime getJoinDate() { return joinDate; }
    public void setJoinDate(LocalDateTime joinDate) { this.joinDate = joinDate; }
    public Integer getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Integer totalOrders) { this.totalOrders = totalOrders; }
    public Double getTotalSpent() { return totalSpent; }
    public void setTotalSpent(Double totalSpent) { this.totalSpent = totalSpent; }
    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
} 