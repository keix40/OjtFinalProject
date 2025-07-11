package com.Ojt.Ecommerce.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SavedCardRequestDTO {
    private Long userId;
    private String cardholderName;
    private String cardNumber;
    private String expiryDate;
    private String cardBrand;
    private boolean isDefault;
}
