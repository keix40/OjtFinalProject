package com.Ojt.Ecommerce.dto;

import com.Ojt.Ecommerce.entity.DiscountType;
import lombok.Data;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class DiscountRequestDTO {
    private String name;
    private String code; // optional
    private String description;
    private Double discountValue;
    private double discount_percent;
    private double discount_amount;
    private String discountType;
    private DiscountType discountTypeForCoupon;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean autoApply;
    private boolean status;
    private boolean isEvent; // Whether this is an event discount or normal discount
    private Long discountId;
    private String targetType; // "BRAND", "CATEGORY", "PRODUCT", "BRAND_CATEGORY"
    private Long targetId; // for brand/category selection
    private String productIds; // comma-separated product IDs for manual selection
    private Long brandId;
    private Long categoryId;
    private String brandCategoryId; // for single brand-category selection
    private String brandIds; // comma-separated brand IDs for multi-selection
    private String categoryIds; // comma-separated category IDs for multi-selection
    private String brandCategoryIds; // comma-separated brand-category IDs for multi-selection
    private List<Long> productIdsforCoupon;
    private String userIds;
    private String vipTierId;
}
