package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.*;
import com.Ojt.Ecommerce.entity.OtpVerification;
import com.Ojt.Ecommerce.entity.RefreshToken;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.entity.VerificationToken;
import com.Ojt.Ecommerce.exception.CustomException;
import com.Ojt.Ecommerce.repository.OtpVerificationRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.repository.VerificationTokenRepository;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import com.Ojt.Ecommerce.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;
    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final RefreshTokenService refreshTokenService;
    private final TokenBlacklistService tokenBlacklistService;
    private final EmailService emailService;
    private final OtpVerificationRepository otpVerificationRepository;
    private final EmailVerificationService emailVerificationService;

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> register(
            @RequestPart("user") RegisterRequest request,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage) {

        String result = userService.register(request, profileImage);
        return ResponseEntity.ok(Map.of("message", result));
    }


    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        org.springframework.security.core.userdetails.User springUser =
                (org.springframework.security.core.userdetails.User) authentication.getPrincipal();

        User user = userRepository.findByEmail(springUser.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!user.isVerified()) {
            throw new CustomException("Please verify your email before logging in.");
        }

        String accessToken = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return ResponseEntity.ok(new LoginResponse(accessToken, refreshToken.getToken()));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtTokenProvider.generateToken(user);
                    return ResponseEntity.ok(new TokenRefreshResponse(token, requestRefreshToken));
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String tokenHeader) {
        String token = tokenHeader.replace("Bearer ", "");
        tokenBlacklistService.blacklistToken(token);
        return ResponseEntity.ok(Map.of("message", "Logout successful. Token has been invalidated."));
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new CustomException("Invalid verification token"));

        User user = verificationToken.getUser();

        if (user.isVerified()) {
            return ResponseEntity.ok(Map.of("message", "Email is already verified."));
        }

        user.setVerified(true);
        userRepository.save(user);
        verificationTokenRepository.delete(verificationToken);

        return ResponseEntity.ok(Map.of("message", "Email verified successfully."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String otp = request.getOtp();

        OtpVerification otpVerification = otpVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("No OTP request found for this email."));

        if (otpVerification.isVerified()) {
            return ResponseEntity.ok(Map.of("message", "Email is already verified."));
        }

        if (!otpVerification.getOtpCode().equals(otp)) {
            throw new CustomException("Invalid OTP.");
        }

        if (otpVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new CustomException("OTP has expired.");
        }

        otpVerification.setVerified(true);
        otpVerificationRepository.save(otpVerification);

        return ResponseEntity.ok(Map.of("message", "OTP verified successfully."));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody EmailRequest request) {
        String email = request.getEmail();
        OtpVerification otpVerification = otpVerificationRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException("User not found"));

        System.out.println("Resend called. Verified? " + otpVerification.isVerified());

        // Optionally allow resending even if verified
        if (otpVerification.isVerified()) {
            System.out.println("Warning: user already verified. Resending anyway.");
            // You can return here if desired, or allow resend
            // return ResponseEntity.ok(Map.of("message", "User already verified"));
        }

        String newOtp = String.format("%06d", new Random().nextInt(999999));
        otpVerification.setOtpCode(newOtp);
        otpVerification.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        otpVerificationRepository.save(otpVerification);

        // Log to confirm email is actually sent
        System.out.println("Sending OTP email to: " + otpVerification.getEmail() + ", OTP: " + newOtp);

        emailService.sendEmail(
                email,
                "Resend OTP Code",
                "Your new OTP code is: " + newOtp
        );

        return ResponseEntity.ok(Map.of("message", "OTP resent. Please check your email."));
    }
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody EmailRequest request) {
        String email = request.getEmail();
        System.out.println("email is :"+email);
        if (!emailVerificationService.isEmailReal(email)) {
            throw new CustomException("Email not found.");
        }

        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new CustomException("Invalid email format.");
        }

        // Check if already verified
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && userOpt.get().isVerified()) {
            throw new CustomException("Email is already verified.");
        }

        // Generate OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Save to DB
        OtpVerification otpVerification = otpVerificationRepository.findByEmail(email)
                .orElse(new OtpVerification());
        otpVerification.setEmail(email);
        otpVerification.setOtpCode(otp);
        otpVerification.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        otpVerification.setVerified(false);
        otpVerificationRepository.save(otpVerification);

        emailService.sendEmail(email, "Your OTP Code", "Your OTP is: " + otp);

        return ResponseEntity.ok(Map.of("message", "OTP sent to " + email));
    }
}