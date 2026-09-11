package com.Ojt.Ecommerce.payment;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Stub for Stripe (or similar) integration. Requires STRIPE_SECRET_KEY and client-side Elements.
 * Do not enable without credentials — throws if invoked.
 */
@Service
@ConditionalOnProperty(name = "app.payment.processor", havingValue = "stripe")
public class StripePaymentTokenizationAdapter implements PaymentTokenizationPort {

    @Override
    public PaymentToken tokenize(String pan, String expiryMonth, String expiryYear, String cardholderName) {
        throw new UnsupportedOperationException(
                "Stripe tokenization is not configured. Set STRIPE_SECRET_KEY, implement PaymentMethod creation, "
                        + "and tokenize on the client with Stripe.js — server should receive payment_method id only.");
    }

    @Override
    public boolean isExternalProcessor() {
        return true;
    }
}
