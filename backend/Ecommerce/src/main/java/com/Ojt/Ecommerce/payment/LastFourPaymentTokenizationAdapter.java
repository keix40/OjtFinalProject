package com.Ojt.Ecommerce.payment;

import com.Ojt.Ecommerce.util.CardMaskingUtil;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Interim P0 adapter: derives last-4 only. Does NOT call an external processor.
 * Set app.payment.processor=stripe and implement StripePaymentTokenizationAdapter for production PCI scope reduction.
 */
@Service
@ConditionalOnProperty(name = "app.payment.processor", havingValue = "local", matchIfMissing = true)
public class LastFourPaymentTokenizationAdapter implements PaymentTokenizationPort {

    @Override
    public PaymentToken tokenize(String pan, String expiryMonth, String expiryYear, String cardholderName) {
        String digits = pan != null ? pan.replaceAll("\\D", "") : "";
        String lastFour = CardMaskingUtil.extractLastFour(digits);
        String brand = inferBrand(digits);
        return new PaymentToken("local:" + lastFour, lastFour, brand);
    }

    @Override
    public boolean isExternalProcessor() {
        return false;
    }

    private static String inferBrand(String digits) {
        if (digits.startsWith("4")) return "VISA";
        if (digits.startsWith("5")) return "MASTERCARD";
        if (digits.startsWith("3")) return "AMEX";
        return "UNKNOWN";
    }
}
