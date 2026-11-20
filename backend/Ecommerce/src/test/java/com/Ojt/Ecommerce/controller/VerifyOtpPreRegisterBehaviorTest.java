package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.OtpRequest;
import com.Ojt.Ecommerce.entity.OtpVerification;
import com.Ojt.Ecommerce.exception.CustomException;
import com.Ojt.Ecommerce.repository.OtpVerificationRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Behavioral: {@code email_verification} OTP can succeed before a {@code User} row exists. */
@ExtendWith(MockitoExtension.class)
class VerifyOtpPreRegisterBehaviorTest {

    @Mock private OtpVerificationRepository otpVerificationRepository;
    @Mock private UserRepository userRepository;

    private AuthController authController;

    @BeforeEach
    void setUp() {
        authController =
                new AuthController(
                        null,
                        null,
                        null,
                        userRepository,
                        null,
                        null,
                        null,
                        null,
                        otpVerificationRepository,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null);
    }

    @Test
    void verifyOtp_beforeRegister_marksOtpVerifiedWithoutUser() {
        String email = "brand-new@test.com";
        OtpVerification row = new OtpVerification();
        row.setEmail(email);
        row.setOtpCode("123456");
        row.setType("email_verification");
        row.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        row.setVerified(false);

        when(otpVerificationRepository.findByEmail(email)).thenReturn(Optional.of(row));
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        OtpRequest request = new OtpRequest();
        request.setEmail(email);
        request.setOtp("123456");

        ResponseEntity<?> response = authController.verifyOtp(request);

        assertTrue(response.getStatusCode().is2xxSuccessful());
        ArgumentCaptor<OtpVerification> captor = ArgumentCaptor.forClass(OtpVerification.class);
        verify(otpVerificationRepository).save(captor.capture());
        assertTrue(captor.getValue().isVerified());
        verify(otpVerificationRepository, never()).delete(row);
    }

    @Test
    void verifyOtp_beforeRegister_rejectsWrongOtp() {
        String email = "brand-new@test.com";
        OtpVerification row = new OtpVerification();
        row.setEmail(email);
        row.setOtpCode("123456");
        row.setType("email_verification");
        row.setExpiryTime(LocalDateTime.now().plusMinutes(10));

        when(otpVerificationRepository.findByEmail(email)).thenReturn(Optional.of(row));

        OtpRequest request = new OtpRequest();
        request.setEmail(email);
        request.setOtp("000000");

        assertThrows(CustomException.class, () -> authController.verifyOtp(request));
    }
}