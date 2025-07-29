package com.Ojt.Ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
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
    private String tier;
    private String dateOfBirth;
}