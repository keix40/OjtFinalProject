package com.Ojt.Ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class UserCouponDTO {
    private Long id;
    private String name;
    private String description;
    private String code;
    private String discountType;
    private Double discountValue;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean status;
    private Boolean autoApply;
    private Double minimumSpend;
    private String couponStatus; // "ACTIVE", "EXPIRED", "ALREADY_USED", "NOT_STARTED"
    private Boolean canUse;
    private String statusMessage;
} 