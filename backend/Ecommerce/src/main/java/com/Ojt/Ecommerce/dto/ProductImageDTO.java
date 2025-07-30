package com.Ojt.Ecommerce.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ProductImageDTO {
    private Long id;
    private String imageUrl;
    private Integer status;
    private Long variantId;

    public ProductImageDTO(Long id, String imageUrl, Integer status) {
        this.id = id;
        this.imageUrl = imageUrl;
        this.status = status;
    }

    public ProductImageDTO(Long id, String imageUrl, Integer status, Long variantId) {
        this.id = id;
        this.imageUrl = imageUrl;
        this.status = status;
        this.variantId = variantId;
    }

    public ProductImageDTO(Long id, String imageUrl, Integer status, Integer variantId) {
        this.id = id;
        this.imageUrl = imageUrl;
        this.status = status;
        this.variantId = variantId != null ? variantId.longValue() : null;
    }
}


