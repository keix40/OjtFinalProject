package com.Ojt.Ecommerce.dto;

import lombok.Data;

import java.util.List;

@Data
public class CouponApplyRequest {
    private String couponCode;
    private Long userId;
    private List<Long> productIds;
}
