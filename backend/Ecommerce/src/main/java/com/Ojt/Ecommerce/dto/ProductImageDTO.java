package com.Ojt.Ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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

}


