package com.Ojt.Ecommerce.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrendingProductDTO {
    private Long id;
    private String productName;
    private String productCode;
    private Double price;
    private Long quantity;
    private String description;
    private Long status;
    private List<ProductImageDTO> productImages;
    private List<CategoryBrandPair> categoryBrandPairs;
    private Double averageRating;
    private Long reviewCount;
    private Boolean hasEvent;
    private Boolean hasDiscount;
    private String eventName;
    private String discountName;
    private Double discountValue;
    private String discountType;
} 