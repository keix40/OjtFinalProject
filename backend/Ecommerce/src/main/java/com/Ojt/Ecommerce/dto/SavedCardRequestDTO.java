package com.Ojt.Ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SavedCardRequestDTO {
    @NotNull(message = "User id is required")
    private Long userId;

    @NotBlank(message = "Cardholder name is required")
    @Size(max = 100)
    private String cardholderName;

    @NotBlank(message = "Card number is required")
    @Pattern(regexp = "^[0-9\\s-]{13,19}$", message = "Invalid card number")
    private String cardNumber;

    @NotBlank(message = "Expiry date is required")
    @Pattern(regexp = "^(0[1-9]|1[0-2])\\/\\d{2}$", message = "Expiry must be MM/YY")
    private String expiryDate;

    private String cardBrand;
    private boolean isDefault;
}
