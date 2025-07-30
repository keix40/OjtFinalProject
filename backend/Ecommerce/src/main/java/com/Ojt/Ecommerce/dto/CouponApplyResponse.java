package com.Ojt.Ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CouponApplyResponse {
    private boolean valid;
    private String message;
    private Double discountAmount;
    private String couponName;
    private String discountType;
    private Long discountId;
}
