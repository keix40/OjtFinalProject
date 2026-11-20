package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.RegisterRequest;
import com.Ojt.Ecommerce.entity.OtpVerification;
import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.repository.DiscountRepository;
import com.Ojt.Ecommerce.repository.DiscountRuleRepository;
import com.Ojt.Ecommerce.repository.OtpVerificationRepository;
import com.Ojt.Ecommerce.repository.RoleRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegisterPreVerifiedOtpBehaviorTest {

    @Mock private EmailVerificationService emailVerificationService;
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private EmailService emailService;
    @Mock private ModelMapper modelMapper;
    @Mock private NotificationService notificationService;
    @Mock private AddressService addressService;
    @Mock private DiscountRepository discountRepository;
    @Mock private DiscountRuleRepository discountRuleRepository;
    @Mock private OtpVerificationRepository otpVerificationRepository;

    @InjectMocks private UserServiceImpl userService;

    private RegisterRequest request;

    @BeforeEach
    void setUp() {
        request = new RegisterRequest();
        request.setName("New User");
        request.setEmail("brand-new@test.com");
        request.setPassword("password123");
        request.setGender("M");
        request.setPhoneNumber("+959123456789");
        request.setDateOfBirth(LocalDate.of(2000, 1, 1));
    }

    @Test
    void register_withPreVerifiedEmailOtp_createsVerifiedUser() {
        when(userRepository.findByEmail("brand-new@test.com")).thenReturn(Optional.empty());

        OtpVerification otp = new OtpVerification();
        otp.setEmail("brand-new@test.com");
        otp.setType("email_verification");
        otp.setVerified(true);
        otp.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        when(otpVerificationRepository.findByEmail("brand-new@test.com")).thenReturn(Optional.of(otp));

        Role customerRole = new Role();
        customerRole.setId(6L);
        when(roleRepository.findById(6L)).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(discountRepository.findByName("First Time Buyer")).thenReturn(Optional.empty());

        userService.register(request, null);

        ArgumentCaptor<com.Ojt.Ecommerce.entity.User> saved = ArgumentCaptor.forClass(com.Ojt.Ecommerce.entity.User.class);
        verify(userRepository).save(saved.capture());
        assertTrue(saved.getValue().isVerified());
        verify(otpVerificationRepository).delete(otp);
    }

    @Test
    void register_withoutPreVerifiedOtp_keepsUserUnverified_loginGateWouldBlock() {
        when(userRepository.findByEmail("brand-new@test.com")).thenReturn(Optional.empty());
        when(otpVerificationRepository.findByEmail("brand-new@test.com")).thenReturn(Optional.empty());

        Role customerRole = new Role();
        customerRole.setId(6L);
        when(roleRepository.findById(6L)).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(discountRepository.findByName("First Time Buyer")).thenReturn(Optional.empty());

        userService.register(request, null);

        ArgumentCaptor<com.Ojt.Ecommerce.entity.User> saved =
                ArgumentCaptor.forClass(com.Ojt.Ecommerce.entity.User.class);
        verify(userRepository).save(saved.capture());
        assertFalse(saved.getValue().isVerified());
    }
}