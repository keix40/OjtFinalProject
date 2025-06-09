package com.Ojt.Ecommerce.dto;

import com.Ojt.Ecommerce.entity.AddressType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressDTO {

    private Long id;
    private String address;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private AddressType type;
    private Long userId; // Reference to User (only user ID for DTO)
    private LocalDateTime createUpdate;
    private LocalDateTime updateDate;
}
