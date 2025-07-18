package com.Ojt.Ecommerce.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class DeliveryServiceDTO {
    private Long id;
    private String name;
    private BigDecimal feePerKm;
    private AddressDTO baseAddress;
}
