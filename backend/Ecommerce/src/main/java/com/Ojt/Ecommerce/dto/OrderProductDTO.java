package com.Ojt.Ecommerce.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderProductDTO {
    private String productName;
    private Integer quantity;
    private Double unitPrice;
    private String variantDetails;
}
