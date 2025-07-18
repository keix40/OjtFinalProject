package com.Ojt.Ecommerce.entity;


import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "revenue_target")
public class RevenueTarget {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String periodType; // 'day', 'week', 'month', 'year'

    @Column(nullable = false)
    private String periodValue; // e.g. '2024-07-18', '2024-W29', '2024-07', '2024'

    @Column(nullable = false)
    private Double targetAmount;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPeriodType() { return periodType; }
    public void setPeriodType(String periodType) { this.periodType = periodType; }
    public String getPeriodValue() { return periodValue; }
    public void setPeriodValue(String periodValue) { this.periodValue = periodValue; }
    public Double getTargetAmount() { return targetAmount; }
    public void setTargetAmount(Double targetAmount) { this.targetAmount = targetAmount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
} 