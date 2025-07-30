package com.Ojt.Ecommerce.dto;
import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryServiceDTO {
    private Long id;
    private String name;
    private BigDecimal feePerKm;
    private AddressDTO baseAddress;
    private String phoneNumber;
    private Long value;
    private String color;
}
