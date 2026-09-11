package com.Ojt.Ecommerce.payment;

/**
 * Boundary for payment processor tokenization.
 * Production should implement with Stripe/similar and store only processor tokens — never PAN.
 */
public interface PaymentTokenizationPort {

    /**
     * @param pan Full card number (never persisted by implementations)
     * @return token reference safe to store (e.g. pm_xxx or local last-4 surrogate)
     */
    PaymentToken tokenize(String pan, String expiryMonth, String expiryYear, String cardholderName);

    /** Whether this adapter sends card data to an external PCI-scoped processor. */
    boolean isExternalProcessor();
}
