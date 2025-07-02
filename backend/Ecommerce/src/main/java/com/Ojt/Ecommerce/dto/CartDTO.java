package com.Ojt.Ecommerce.dto;

import jakarta.persistence.criteria.CriteriaBuilder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CartDTO {
    private Long productId;
    private Integer variantId;
    private Integer quantity;
    private Double price;
}
