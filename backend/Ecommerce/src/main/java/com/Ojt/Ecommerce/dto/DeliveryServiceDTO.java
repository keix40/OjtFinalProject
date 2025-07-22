package com.Ojt.Ecommerce.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class DeliveryServiceDTO {
    private Long id;
    private String name;
    private BigDecimal feePerKm;
    private AddressDTO baseAddress;
    private String phoneNumber;
}
