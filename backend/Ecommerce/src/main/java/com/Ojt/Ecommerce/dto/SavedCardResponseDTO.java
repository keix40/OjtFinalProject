package com.Ojt.Ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class SavedCardResponseDTO {
    private Long id;
    private String cardholderName;
    private String cardBrand;
    private String expiryDate;
    private boolean isDefault;
    /** Last four digits only — full PAN is never returned. */
    private String lastFour;
    /** Display-friendly masked value for UI. */
    private String maskedNumber;
}
