package com.Ojt.Ecommerce.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReturnRequestProductDTO {
    private Long id;
    private Long orderProductId;
    private String productName;
    private String sku;
    private Integer quantity;
    private Double unitPrice;
    private Double totalAmount;
    private String productRemark;
} 