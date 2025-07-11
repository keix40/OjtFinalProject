package com.Ojt.Ecommerce.dto;

import lombok.Data;

@Data
public class PaymentRequestDTO {
    private Long orderId;
    private String cardNumber;
    private String cardholderName;
    private String expiryDate;
    private String cvv;
}
