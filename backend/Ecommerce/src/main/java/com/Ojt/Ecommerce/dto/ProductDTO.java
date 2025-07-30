package com.Ojt.Ecommerce.dto;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ProductDTO {
    private Long id;
    private String productName;
    private String productCode;
    private double price;
    private Long quantity;
    private String description;
    private Long status;

    @JsonProperty("categoryBrandArray")
    private List<CategoryBrandPair> categoryBrandPairs;

    private List<ProductImageDTO> productImages;
    private Boolean hasVariant;
    private List<AttributeAndValueDTO> attributes;  // use your existing DTO here
    private List<VariantDTO> variants;               // create this DTO as it's missing

    // For image deletion
    private List<Long> imagesMarkedForDeletion;
    private Map<String, List<Long>> variantImagesMarkedForDeletion;
    // For category-brand pair deletion
    private List<CategoryBrandPair> categoryBrandPairsMarkedForDeletion;
    
    // Discount fields
    private Boolean hasDiscount;
    private String discountType;
    private Double discountValue;
    private String discountName;
    
    // Rating fields
    private Double averageRating;
    private Integer reviewCount;
}
