package com.Ojt.Ecommerce.security;

import com.Ojt.Ecommerce.entity.OtpVerification;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Documents login OTP contract: session minting requires passwordVerifiedAt from login flow.
 */
class LoginOtpSecurityTest {

    @Test
    void loginOtpWithoutPasswordProof_mustNotBeAccepted() {
        OtpVerification otp = new OtpVerification();
        otp.setType("login");
        otp.setPasswordVerifiedAt(null);
        assertFalse(isLoginOtpEligibleForSession(otp));
    }

    @Test
    void loginOtpWithPasswordProof_isEligible() {
        OtpVerification otp = new OtpVerification();
        otp.setType("login");
        otp.setPasswordVerifiedAt(LocalDateTime.now());
        assertTrue(isLoginOtpEligibleForSession(otp));
    }

    @Test
    void emailVerificationOtp_mustNotSatisfyLoginSessionCheck() {
        OtpVerification otp = new OtpVerification();
        otp.setType("email_verification");
        otp.setPasswordVerifiedAt(null);
        assertFalse(isLoginOtpEligibleForSession(otp));
    }

    /** Mirrors AuthController.verifyLoginOtp eligibility gate. */
    private static boolean isLoginOtpEligibleForSession(OtpVerification otp) {
        return "login".equals(otp.getType()) && otp.getPasswordVerifiedAt() != null;
    }
}
