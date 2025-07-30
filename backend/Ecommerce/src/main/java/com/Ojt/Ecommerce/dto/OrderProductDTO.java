package com.Ojt.Ecommerce.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderProductDTO {
    private Long productId;
    private String productName;
    private Integer quantity;
    private Double unitPrice;
    private String variantDetails;
    private Long orderProductId;
    private Integer variantId;
    private String sku;
    private String status;
    private Double originalPrice;
    private Double discountedPrice;
}
