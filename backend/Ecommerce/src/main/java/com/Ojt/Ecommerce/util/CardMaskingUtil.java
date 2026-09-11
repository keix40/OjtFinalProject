package com.Ojt.Ecommerce.util;

public final class CardMaskingUtil {

    private CardMaskingUtil() {
    }

    /** Extract last 4 digits from a card number; never persist the full PAN. */
    public static String extractLastFour(String cardNumber) {
        if (cardNumber == null || cardNumber.isBlank()) {
            throw new IllegalArgumentException("Card number is required");
        }
        String digits = cardNumber.replaceAll("\\D", "");
        if (digits.length() < 4) {
            throw new IllegalArgumentException("Invalid card number");
        }
        return digits.substring(digits.length() - 4);
    }

    /** Mask legacy full PAN values already stored in the database. */
    public static String maskForDisplay(String storedValue) {
        if (storedValue == null || storedValue.isBlank()) {
            return "";
        }
        String digits = storedValue.replaceAll("\\D", "");
        if (digits.length() <= 4) {
            return digits;
        }
        return digits.substring(digits.length() - 4);
    }
}
