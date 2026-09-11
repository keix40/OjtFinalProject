package com.Ojt.Ecommerce.payment;

public record PaymentToken(String tokenReference, String lastFour, String cardBrand) {
}
