package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.*;
import com.Ojt.Ecommerce.entity.*;
import com.Ojt.Ecommerce.exception.CustomException;
import com.Ojt.Ecommerce.repository.OtpVerificationRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.repository.VerificationTokenRepository;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import com.Ojt.Ecommerce.service.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
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

    @Autowired
    private LoginAttemptService loginAttemptService;

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
    private final PasswordEncoder passwordEncoder;






    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> register(
            @RequestPart("user") RegisterRequest request,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage) {

        String result = userService.register(request, profileImage);
        return ResponseEntity.ok(Map.of("message", result));
    }


//    @PostMapping("/login")
//    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
//        String email = loginRequest.getEmail().trim().toLowerCase();// add for case
//        Authentication authentication = authenticationManager.authenticate(
//                new UsernamePasswordAuthenticationToken(
//                        email,
//                        loginRequest.getPassword()
//                )
//        );
//
//
//        SecurityContextHolder.getContext().setAuthentication(authentication);
//
//        org.springframework.security.core.userdetails.User springUser =
//                (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
//
//        User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
//
//        if (!user.isVerified()) {
//            throw new CustomException("Please verify your email before logging in.");
//        }
//
//        String accessToken = jwtTokenProvider.generateToken(user);
//        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
//
//        return ResponseEntity.ok(new LoginResponse(accessToken, refreshToken.getToken()));
//    }

    @PostMapping("/login") // test login attempt
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        String email = loginRequest.getEmail().trim().toLowerCase();
        String ip = request.getRemoteAddr();

        // ✅ Blocked IP check (MUST be before authentication)
        if (loginAttemptService.isBlockedIP(ip)) {
            throw new CustomException("This IP address has been blocked due to suspicious activity.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, loginRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            org.springframework.security.core.userdetails.User springUser =
                    (org.springframework.security.core.userdetails.User) authentication.getPrincipal();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            if (!user.isVerified()) {
                throw new CustomException("Please verify your email before logging in.");
            }

            // ✅ Save successful attempt
            // ➕ Prepare DTO for successful attempt
            LoginAttemptDTO successDTO = LoginAttemptDTO.builder()
                    .username(email)
                    .ipAddress(ip)
                    .userAgent(request.getHeader("User-Agent"))
                    .timestamp(LocalDateTime.now())
                    .status("successful")
                    .isBlocked(false)
                    .isVPN(false)  // you can set real detection here
                    .isProxy(false)
                    .location("Unknown") // or real geo location
                    .attemptCount(1)
                    .build();

            // ➕ Calculate threat score and level
            int score = loginAttemptService.calculateThreatScore(successDTO);
            successDTO.setThreatScore(score);
            successDTO.setThreatLevel(loginAttemptService.determineThreatLevel(score));

            // 💾 Save
            loginAttemptService.saveAttempt(successDTO);

            String accessToken = jwtTokenProvider.generateToken(user);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

            return ResponseEntity.ok(new LoginResponse(accessToken, refreshToken.getToken()));

        } catch (Exception ex) {
            // ❌ Save failed attempt
            // ➕ Prepare DTO for failed attempt
            LoginAttemptDTO failDTO = LoginAttemptDTO.builder()
                    .username(email)
                    .ipAddress(ip)
                    .userAgent(request.getHeader("User-Agent"))
                    .timestamp(LocalDateTime.now())
                    .status("failed")
                    .isBlocked(false)
                    .isVPN(false)
                    .isProxy(false)
                    .location("Unknown")
                    .attemptCount(1)
                    .build();

            // ➕ Calculate threat score and level
            int score = loginAttemptService.calculateThreatScore(failDTO);
            failDTO.setThreatScore(score);
            failDTO.setThreatLevel(loginAttemptService.determineThreatLevel(score));

            // 💾 Save
            loginAttemptService.saveAttempt(failDTO);

            throw ex;
        }
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

    @PostMapping("/sendOtp")
    public ResponseEntity<?> sendOtp(@RequestBody EmailRequest request) {
        String email = request.getEmail().trim().toLowerCase();
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
    //add (for otp code for password reset)
    @PostMapping("/send-reset-otp")
    public ResponseEntity<?> sendResetOtp(@RequestBody EmailRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        System.out.println("email is :"+email);

        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new CustomException("Invalid email format.");
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new CustomException("No account found with this email.");
        }

        if (!userOpt.get().isVerified()) {
            throw new CustomException("No account found with this email.");
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

        emailService.sendEmail(email, "Password Reset OTP", "Your OTP is: " + otp);

        return ResponseEntity.ok(Map.of("message", "OTP sent to " + email));
    }

    @PostMapping("/forgot-password")   //for forgot passward
    public ResponseEntity<?> forgotPassword(@RequestBody EmailRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // ✅ Check if user exists and is verified
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found"));

        if (!user.isVerified()) {
            throw new CustomException("User email is not verified.");
        }

        // ✅ Generate OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // ✅ Save or update OTP
        OtpVerification otpVerification = otpVerificationRepository.findByEmail(email)
                .orElse(new OtpVerification());

        otpVerification.setEmail(email);
        otpVerification.setOtpCode(otp);
        otpVerification.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        otpVerification.setVerified(false); // mark for reset, not for registration
        otpVerificationRepository.save(otpVerification);

        // ✅ Send OTP via email
        emailService.sendEmail(email, "Reset Password OTP", "Your OTP for password reset is: " + otp);
        return ResponseEntity.ok(Map.of("message", "OTP sent for password reset."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String newPassword = request.getNewPassword();

        // ✅ Get user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found"));

        // ✅ Check OTP is verified
        OtpVerification otpVerification = otpVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("No OTP found for this email"));

        if (!otpVerification.isVerified() || otpVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new CustomException("OTP not verified or expired");
        }

        // ✅ Set new password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // ✅ Invalidate OTP after reset
        otpVerification.setVerified(false);
        otpVerificationRepository.save(otpVerification);

        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }

    //add for profile avatar update by pmk june 13
    @PutMapping(value = "/update-avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateAvatar(
            @RequestPart("image") MultipartFile image,
            @RequestHeader("Authorization") String tokenHeader) {

        String token = tokenHeader.replace("Bearer ", "");

        String imagePath = userService.uploadProfileImage(token, image);

        return ResponseEntity.ok(Map.of(
                "message", "Profile image updated successfully",
                "imagePath", imagePath
        ));
    }
}