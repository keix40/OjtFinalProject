package com.Ojt.Ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistItemDTO {
    private Long id;
    private String productName;
    private Double originalPrice;
    private Double discountedPrice;
    private String imageUrl;
    private LocalDateTime wishlistDate;
    private Boolean hasDiscount;
    private String discountType; // "PERCENTAGE" or "FIXED"
    private Double discountValue;
    private String discountName;
} 