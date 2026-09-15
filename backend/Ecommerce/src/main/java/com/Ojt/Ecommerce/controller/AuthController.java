package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.*;
import com.Ojt.Ecommerce.entity.*;
import com.Ojt.Ecommerce.exception.CustomException;
import com.Ojt.Ecommerce.repository.OtpVerificationRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.repository.VerificationTokenRepository;
import com.Ojt.Ecommerce.repository.VipTierRepository;
import com.Ojt.Ecommerce.security.AuthCookieService;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import com.Ojt.Ecommerce.security.SecurityUtils;
import com.Ojt.Ecommerce.service.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import com.Ojt.Ecommerce.dto.EmailRequest;
import java.security.SecureRandom;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.json.JSONObject;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.Ojt.Ecommerce.service.UserActivityService;
import com.Ojt.Ecommerce.annotations.LogActivity;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.service.ActivityLogService;
import com.Ojt.Ecommerce.util.IpLocationUtil;
import com.Ojt.Ecommerce.service.BlacklistServiceImpl;
import com.Ojt.Ecommerce.entity.BlacklistEntry;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;

@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:4200"})
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    @Autowired
    private LoginAttemptService loginAttemptService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserActivityService userActivityService;

    @Autowired
    private ActivityLogService activityLogService;

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
    private final BlacklistServiceImpl blacklistServiceImpl;
    private final NotificationService notificationService;
    private final AuthCookieService authCookieService;
    private final VipTierRepository vipTierRepository;

    @Value("${ipqs.api.key:}")
    private String ipqsApiKey;

    // Configurable thresholds
    private static final int THREAT_SCORE_BLOCK_THRESHOLD = 60; // 60 = high, 80 = critical
    private static final int ATTEMPT_WINDOW_MINUTES = 5;


    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> register(
            @Valid @RequestPart("user") RegisterRequest request,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage) {

        String result = userService.register(request, profileImage);
        return ResponseEntity.ok(Map.of("message", result));
    }




//    @LogActivity(actionType = "LOGIN", entityType = "USER", description = "User login", severityLevel = "LOW")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request, HttpServletResponse response) {
        // Start timing for duration tracking
        java.time.LocalDateTime startTime = java.time.LocalDateTime.now();

        String email = loginRequest.getEmail().trim().toLowerCase();
        String password = loginRequest.getPassword();
        String ip = IpLocationUtil.extractClientIp(request);
        String location = loginRequest.getLocation() != null ? loginRequest.getLocation() : "";
        boolean isVPN = false;
        boolean isProxy = false;
        try {
            if (ipqsApiKey != null && !ipqsApiKey.isBlank()) {
                String ipqsUrl = "https://ipqualityscore.com/api/json/ip/" + ipqsApiKey + "/" + ip;
                HttpClient client = HttpClient.newHttpClient();
                HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(ipqsUrl))
                    .build();
                HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
                org.json.JSONObject obj = new org.json.JSONObject(resp.body());
                if (obj.has("vpn")) {
                    isVPN = obj.getBoolean("vpn");
                }
                if (obj.has("proxy")) {
                    isProxy = obj.getBoolean("proxy");
                }
            }
        } catch (Exception e) {
            // Log or handle error, but do not block login
            System.err.println("[VPN/Proxy Detection] Error: " + e.getMessage());
        }
        boolean banned = loginAttemptService.isIPBlocked(ip);
        if (banned) {
            return ResponseEntity.status(403).body(Map.of(
                "message", "Your IP is temporarily banned due to too many failed login attempts.",
                "banned", true
            ));
        }
        boolean requireOtpCaptcha = loginAttemptService.isOtpCaptchaRequired(ip);

        // Blacklist enforcement: check if user is blacklisted by email
        try {
            BlacklistEntry blacklistEntry = blacklistServiceImpl.getActiveBlacklistByEmail(email);
            if (blacklistEntry != null) {
                
                // Handle permanent ban (null expiry date) vs temporary ban
                String banType = blacklistEntry.getExpiryDate() == null ? "Permanent" : "Temporary";
                
                return ResponseEntity.status(403).body(Map.of(
                    "blocked", true,
                    "reason", blacklistEntry.getReason(),
                    "expiryDate", blacklistEntry.getExpiryDate(),
                    "banType", banType,
                    "isPermanent", blacklistEntry.getExpiryDate() == null
                ));
            } else {
            }
        } catch (Exception e) {
            System.err.println("[Blacklist Check] Error checking blacklist: " + e.getMessage());
            e.printStackTrace();
            // Don't block login if blacklist check fails, just log the error
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
            // If password is correct, check if OTP/CAPTCHA is required
            if (requireOtpCaptcha) {
                // Generate a login OTP (not email verification OTP)
                String otp = generateOtpCode();
                OtpVerification otpVerification = otpVerificationRepository.findByEmail(email)
                    .orElse(new OtpVerification());
                otpVerification.setEmail(email);
                otpVerification.setOtpCode(otp);
                otpVerification.setExpiryTime(LocalDateTime.now().plusMinutes(10));
                otpVerification.setVerified(false);
                otpVerification.setType("login");
                otpVerification.setPasswordVerifiedAt(LocalDateTime.now());
                otpVerificationRepository.save(otpVerification);
                try {
                    emailService.sendEmail(email, "Your Login OTP Code", "Your OTP for login verification is: " + otp);
                } catch (Exception ex) {
                    log.warn("Failed to send login OTP email to {}: {}", email, ex.getMessage());
                }
                return ResponseEntity.status(401).body(Map.of(
                    "otpRequired", true,
                    "captchaRequired", true,
                    "message", "OTP and CAPTCHA verification required for login."
                ));
            }
            SecurityContextHolder.getContext().setAuthentication(authentication);
            // Fetch user with role for activity log
            User user = userRepository.findByEmailWithRole(email)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));
            if (!user.isVerified()) {
                throw new CustomException("Please verify your email before logging in.");
            }
            // Log user activity for dashboard active users metric
            userActivityService.logActivity(user.getId(), "login");
            // Update lastLogin timestamp
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
            // Save successful attempt
            String sessionId = null;
            var session = request.getSession();
            if (session != null) {
                Object shortSessionId = session.getAttribute("shortSessionId");
                if (shortSessionId == null) {
                    shortSessionId = generateShortSessionId();
                    session.setAttribute("shortSessionId", shortSessionId);
                }
                sessionId = shortSessionId.toString();
            }
            LoginAttemptDTO successDTO = LoginAttemptDTO.builder()
                    .username(email)
                    .ipAddress(ip)
                    .userAgent(request.getHeader("User-Agent"))
                    .timestamp(LocalDateTime.now())
                    .status("successful")
                    .isBlocked(false)
                    .isVPN(isVPN)
                    .isProxy(isProxy)
                    .location(location)
                    .countryCode("")
                    .attemptCount(loginAttemptService.calculateRecentAttemptCount(ip, LocalDateTime.now()))
                    .sessionId(sessionId)
                    .build();
            loginAttemptService.enrichAttemptWithStats(successDTO);
            int score = loginAttemptService.calculateThreatScore(successDTO);
            successDTO.setThreatScore(score);
            successDTO.setThreatLevel(loginAttemptService.determineThreatLevel(score));
            loginAttemptService.saveAttempt(successDTO);
            // --- Broadcast real-time activity feed event ---
            // In AuthController.java, after a successful login:
            String activityMsg = "Successful login for " + email + " from IP " + ip;
           /* notificationService.sendNotificationToAllAdmins(activityMsg, "login_attempt", null);
            List<User> admins = userRepository.findByRoleId(1L);
            for (User admin : admins) {
                messagingTemplate.convertAndSendToUser(
                        admin.getEmail(),
                        "/queue/notifications",
                        Map.of(
                                "timestamp", LocalDateTime.now().toString(),
                                "type", "success",
                                "message", activityMsg
                        )
                );
            } */
            // Reset OTP/CAPTCHA for this IP
            loginAttemptService.handleSuccessfulLogin(ip);
            String accessToken = jwtTokenProvider.generateToken(user);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
            // --- MANUAL ACTIVITY LOGGING FOR LOGIN ---
            java.time.LocalDateTime endTime = java.time.LocalDateTime.now();
            java.time.Duration duration = java.time.Duration.between(startTime, endTime);
            long durationMillis = duration.toMillis();
            
            // Get real IP and location using the same method as login attempts
            String realIp = IpLocationUtil.extractClientIp(request);
            String userLocation = IpLocationUtil.getUserLocation(realIp);
            
            Map<String, Object> detailsMap = new java.util.HashMap<>();
            detailsMap.put("SessionId", sessionId);
            detailsMap.put("Location", userLocation);
            detailsMap.put("Duration", durationMillis + "ms");
            detailsMap.put("StartTime", startTime.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss")));
            detailsMap.put("EndTime", endTime.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss")));
            String detailsJson;
            try {
                detailsJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(detailsMap);
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                detailsJson = "{\"SessionId\":\"" + sessionId + "\",\"Location\":\"" + location + "\",\"Duration\":\"" + durationMillis + "ms\"}";
            }

            ActivityLog log = activityLogService.createActivityLog(
                user.getId(),
                user.getName(),
                user.getRole() != null ? user.getRole().getName() : "UNKNOWN",
                "LOGIN",
                "USER",
                String.valueOf(user.getId()),
                "User login",
                "LOW",
                realIp,
                request.getHeader("User-Agent"),
                sessionId
            );
            log.setDetails(detailsJson);
            activityLogService.createActivityLog(log);
            // --- END MANUAL LOGGING ---
            return issueAuthResponse(response, user, accessToken, refreshToken.getToken());
        
        } catch (AuthenticationException ex) {
            recordFailedLogin(email, ip, location, request, isVPN, isProxy);
            return ResponseEntity.status(401).body(Map.of(
                    "message", "Invalid email or password.",
                    "status", 401
            ));
        } catch (Exception ex) {
            recordFailedLogin(email, ip, location, request, isVPN, isProxy);
            throw ex;
        }
    }

    private void recordFailedLogin(
            String email,
            String ip,
            String location,
            HttpServletRequest request,
            boolean isVPN,
            boolean isProxy) {
        LoginAttemptDTO failDTO = LoginAttemptDTO.builder()
                .username(email)
                .ipAddress(ip)
                .userAgent(request.getHeader("User-Agent"))
                .timestamp(LocalDateTime.now())
                .status("failed")
                .isBlocked(false)
                .isVPN(isVPN)
                .isProxy(isProxy)
                .location(location)
                .countryCode("")
                .attemptCount(loginAttemptService.calculateRecentAttemptCount(ip, LocalDateTime.now()))
                .sessionId(null)
                .build();
        loginAttemptService.enrichAttemptWithStats(failDTO);
        int score = loginAttemptService.calculateThreatScore(failDTO);
        failDTO.setThreatScore(score);
        failDTO.setThreatLevel(loginAttemptService.determineThreatLevel(score));
        loginAttemptService.saveAttempt(failDTO);
        String activityMsg = "Failed login for " + email + " from IP " + ip
                + (isVPN ? " [VPN detected]" : "")
                + (isProxy ? " [Proxy detected]" : "");
        messagingTemplate.convertAndSend("/topic/activity-feed", Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "type", isVPN || isProxy ? "danger" : "warning",
                "message", activityMsg
        ));
        loginAttemptService.handleFailedLogin(email, ip, location);
    }

    // Utility to generate a short, user-friendly session ID
    private static String generateShortSessionId() {
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder("sess_");
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0];
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }


    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(
            @RequestBody(required = false) TokenRefreshRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String requestRefreshToken = authCookieService.getRefreshToken(httpRequest)
                .orElse(request != null ? request.getRefreshToken() : null);
        if (requestRefreshToken == null || requestRefreshToken.isBlank()) {
            throw new CustomException("Refresh token is required");
        }

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String accessToken = jwtTokenProvider.generateToken(user);
                    authCookieService.setAuthCookies(httpResponse, accessToken, requestRefreshToken);
                    return ResponseEntity.ok(Map.of("message", "Token refreshed", "authenticated", true));
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }

    @LogActivity(actionType = "LOGOUT", entityType = "USER", description = "User logout", severityLevel = "LOW")
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        authCookieService.getAccessToken(request).ifPresent(tokenBlacklistService::blacklistToken);
        authCookieService.getRefreshToken(request).ifPresent(refreshToken ->
                refreshTokenService.findByToken(refreshToken).ifPresent(rt ->
                        refreshTokenService.deleteByUserId(rt.getUser().getId())));
        authCookieService.clearAuthCookies(response);
        return ResponseEntity.ok(Map.of("message", "Logout successful. Token has been invalidated."));
    }

    @GetMapping("/me")
    public ResponseEntity<?> currentSession() {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userRepository::findById)
                .map(user -> {
                    String roles = user.getRole() != null ? "ROLE_" + user.getRole().getName() : "";
                    String permissions = user.getRole() != null
                            ? user.getRole().getPermissions().stream()
                                .map(p -> p.getKey())
                                .collect(java.util.stream.Collectors.joining(","))
                            : "";
                    Map<String, Object> body = new java.util.HashMap<>();
                    body.put("id", user.getId());
                    body.put("sub", user.getEmail());
                    body.put("name", user.getName());
                    body.put("roles", roles);
                    body.put("permissions", permissions);
                    body.put("verified", user.isVerified());
                    VipTier vipTier = vipTierRepository.findTopByMinPointsLessThanEqualOrderByMinPointsDesc(
                            user.getTotalPoints() != null ? user.getTotalPoints() : 0
                    ).orElse(null);
                    body.put("vipTier", vipTier != null ? vipTier.getName() : "Regular");
                    return ResponseEntity.ok(body);
                })
                .orElse(ResponseEntity.status(401).body(Map.of("message", "Not authenticated")));
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
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody OtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String otp = request.getOtp();
        OtpVerification otpVerification = otpVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("No OTP request found for this email."));
        if (!"email_verification".equals(otpVerification.getType())) {
            throw new CustomException("Invalid OTP type for email verification.");
        }
        if (!otpVerification.getOtpCode().equals(otp)) {
            throw new CustomException("Invalid OTP.");
        }
        if (otpVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new CustomException("OTP has expired.");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found"));
        user.setVerified(true);
        userRepository.save(user);
        otpVerificationRepository.delete(otpVerification);
        return ResponseEntity.ok(Map.of("message", "OTP verified successfully."));
    }

    @PostMapping("/verify-login-otp")
    public ResponseEntity<?> verifyLoginOtp(@Valid @RequestBody OtpRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String email = request.getEmail().trim().toLowerCase();
        String otp = request.getOtp();
        
        OtpVerification otpVerification = otpVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("No OTP request found for this email."));
        
        if (!"login".equals(otpVerification.getType())) {
            throw new CustomException("Invalid OTP type for login verification.");
        }
        if (otpVerification.getPasswordVerifiedAt() == null) {
            throw new CustomException("Login OTP was not issued after password verification.");
        }

        // Verify OTP correctness and expiry
        if (!otpVerification.getOtpCode().equals(otp)) {
            throw new CustomException("Invalid OTP.");
        }
        if (otpVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new CustomException("OTP has expired.");
        }
        
        // Get user and authenticate
        User user = userRepository.findByEmailWithRole(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        
        // Create authentication and generate tokens
        Authentication authentication = new UsernamePasswordAuthenticationToken(
            user.getEmail(), null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        // Log user activity for dashboard active users metric
        userActivityService.logActivity(user.getId(), "login");
        
        // Update lastLogin timestamp
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        // Generate tokens
        String accessToken = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
        
        // Clear the OTP after successful verification
        otpVerificationRepository.delete(otpVerification);
        
        // Log activity
        String ip = IpLocationUtil.extractClientIp(httpRequest);
        String sessionId = null;
        var session = httpRequest.getSession();
        if (session != null) {
            Object shortSessionId = session.getAttribute("shortSessionId");
            if (shortSessionId == null) {
                shortSessionId = generateShortSessionId();
                session.setAttribute("shortSessionId", shortSessionId);
            }
            sessionId = shortSessionId.toString();
        }
        
        // Manual activity logging for login OTP verification
        java.time.LocalDateTime startTime = java.time.LocalDateTime.now();
        java.time.LocalDateTime endTime = java.time.LocalDateTime.now();
        java.time.Duration duration = java.time.Duration.between(startTime, endTime);
        long durationMillis = duration.toMillis();
        
        String realIp = IpLocationUtil.extractClientIp(httpRequest);
        String userLocation = IpLocationUtil.getUserLocation(realIp);
        
        Map<String, Object> detailsMap = new java.util.HashMap<>();
        detailsMap.put("SessionId", sessionId);
        detailsMap.put("Location", userLocation);
        detailsMap.put("Duration", durationMillis + "ms");
        detailsMap.put("StartTime", startTime.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss")));
        detailsMap.put("EndTime", endTime.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss")));
        String detailsJson;
        try {
            detailsJson = new ObjectMapper().writeValueAsString(detailsMap);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            detailsJson = "{\"SessionId\":\"" + sessionId + "\",\"Location\":\"" + userLocation + "\",\"Duration\":\"" + durationMillis + "ms\"}";
        }

        ActivityLog log = activityLogService.createActivityLog(
            user.getId(),
            user.getName(),
            user.getRole() != null ? user.getRole().getName() : "UNKNOWN",
            "LOGIN_OTP_VERIFICATION",
            "USER",
            String.valueOf(user.getId()),
            "User login OTP verification",
            "LOW",
            realIp,
            httpRequest.getHeader("User-Agent"),
            sessionId
        );
        log.setDetails(detailsJson);
        activityLogService.createActivityLog(log);
        
        return issueAuthResponse(httpResponse, user, accessToken, refreshToken.getToken());
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@Valid @RequestBody EmailRequest request) {
        String email = request.getEmail();
        OtpVerification otpVerification = otpVerificationRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException("User not found"));


        // Optionally allow resending even if verified
        if (otpVerification.isVerified()) {
            // You can return here if desired, or allow resend
            // return ResponseEntity.ok(Map.of("message", "User already verified"));
        }

        String newOtp = generateOtpCode();
        otpVerification.setOtpCode(newOtp);
        otpVerification.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        if (otpVerification.getType() == null || otpVerification.getType().isBlank()) {
            otpVerification.setType("email_verification");
        }
        otpVerificationRepository.save(otpVerification);

        emailService.sendEmail(
                email,
                "Resend OTP Code",
                "Your new OTP code is: " + newOtp
        );

        return ResponseEntity.ok(Map.of("message", "OTP resent. Please check your email."));
    }

    @PostMapping("/sendOtp")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody EmailRequest request) {
        String email = request.getEmail().trim().toLowerCase();
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
        String otp = generateOtpCode();

        // Save to DB
        OtpVerification otpVerification = otpVerificationRepository.findByEmail(email)
                .orElse(new OtpVerification());
        otpVerification.setEmail(email);
        otpVerification.setOtpCode(otp);
        otpVerification.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        otpVerification.setVerified(false);
        otpVerification.setType("email_verification");
        otpVerification.setPasswordVerifiedAt(null);
        otpVerificationRepository.save(otpVerification);

        emailService.sendEmail(email, "Your OTP Code", "Your OTP is: " + otp);

        return ResponseEntity.ok(Map.of("message", "OTP sent to " + email));
    }
    //add (for otp code for password reset)
    @PostMapping("/send-reset-otp")
    public ResponseEntity<?> sendResetOtp(@Valid @RequestBody EmailRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new CustomException("Invalid email format.");
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new CustomException("No account found with this email.");
        }


        // Generate OTP
        String otp = generateOtpCode();

        // Save to DB
        OtpVerification otpVerification = otpVerificationRepository.findByEmail(email)
                .orElse(new OtpVerification());
        otpVerification.setEmail(email);
        otpVerification.setOtpCode(otp);
        otpVerification.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        otpVerification.setVerified(false);
        otpVerification.setType("password_reset");
        otpVerification.setPasswordVerifiedAt(null);
        otpVerificationRepository.save(otpVerification);

        emailService.sendEmail(email, "Password Reset OTP", "Your OTP is: " + otp);

        return ResponseEntity.ok(Map.of("message", "OTP sent to " + email));
    }

    @PostMapping("/forgot-password")   //for forgot passward
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody EmailRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // ✅ Check if user exists and is verified
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found"));


        // ✅ Generate OTP
        String otp = generateOtpCode();

        // ✅ Save or update OTP
        OtpVerification otpVerification = otpVerificationRepository.findByEmail(email)
                .orElse(new OtpVerification());

        otpVerification.setEmail(email);
        otpVerification.setOtpCode(otp);
        otpVerification.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        otpVerification.setVerified(false);
        otpVerification.setType("password_reset");
        otpVerification.setPasswordVerifiedAt(null);
        otpVerificationRepository.save(otpVerification);

        emailService.sendEmail(email, "Reset Password OTP", "Your OTP for password reset is: " + otp);
        return ResponseEntity.ok(Map.of("message", "OTP sent for password reset."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String newPassword = request.getNewPassword();
        String otp = request.getOtp();

        if (otp == null || otp.isBlank()) {
            throw new CustomException("OTP is required");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found"));

        OtpVerification otpVerification = otpVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("No OTP found for this email"));

        if (!"password_reset".equals(otpVerification.getType())) {
            throw new CustomException("Invalid OTP type for password reset.");
        }
        if (otpVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new CustomException("OTP expired");
        }
        if (!otpVerification.getOtpCode().equals(otp)) {
            throw new CustomException("Invalid OTP");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        otpVerificationRepository.delete(otpVerification);

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

    @PostMapping("/validate-real-email")
    public ResponseEntity<?> validateRealEmail(@Valid @RequestBody EmailRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        boolean isReal = emailVerificationService.isEmailReal(email);
        if (isReal) {
            return ResponseEntity.ok(Map.of("real", true, "message", "Email is real/active."));
        } else {
            return ResponseEntity.ok(Map.of("real", false, "message", "Email does not exist or is not active."));
        }
    }

    @GetMapping("/check-blacklist-status")
    public ResponseEntity<?> checkBlacklistStatus(
            HttpServletRequest request,
            @RequestHeader(value = "Authorization", required = false) String tokenHeader) {
        try {
            String token = authCookieService.getAccessToken(request)
                    .orElse(tokenHeader != null && tokenHeader.startsWith("Bearer ")
                            ? tokenHeader.substring(7) : null);
            if (token == null || !jwtTokenProvider.validateToken(token)) {
                return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
            }
            String email = jwtTokenProvider.getEmailFromToken(token);
            String clientIp = getClientIpAddress(request);
            
            // Get user's phone number from token if available
            String phoneNumber = null;
            try {
                phoneNumber = jwtTokenProvider.getPhoneNumberFromToken(token);
            } catch (Exception e) {
                // Phone number not available in token, continue without it
            }
            
            // Check if user is blacklisted by email
            BlacklistEntry emailBlacklistEntry = blacklistServiceImpl.getActiveBlacklistByEmail(email);
            
            // Check if user is blacklisted by IP
            BlacklistEntry ipBlacklistEntry = blacklistServiceImpl.getActiveBlacklistByIp(clientIp);
            
            // Check if user is blacklisted by phone number
            BlacklistEntry phoneBlacklistEntry = null;
            if (phoneNumber != null) {
                phoneBlacklistEntry = blacklistServiceImpl.getActiveBlacklistByPhone(phoneNumber);
                if (phoneBlacklistEntry != null) {
                } else {
                }
            } else {
            }
            
            // If any of email, IP, or phone is blacklisted, return blacklisted status
            if (emailBlacklistEntry != null) {
                return ResponseEntity.ok(Map.of(
                    "blacklisted", true,
                    "reason", emailBlacklistEntry.getReason(),
                    "expiryDate", emailBlacklistEntry.getExpiryDate(),
                    "banType", emailBlacklistEntry.getExpiryDate() == null ? "Permanent" : "Temporary",
                    "isPermanent", emailBlacklistEntry.getExpiryDate() == null,
                    "blacklistType", "email"
                ));
            } else if (ipBlacklistEntry != null) {
                return ResponseEntity.ok(Map.of(
                    "blacklisted", true,
                    "reason", ipBlacklistEntry.getReason(),
                    "expiryDate", ipBlacklistEntry.getExpiryDate(),
                    "banType", ipBlacklistEntry.getExpiryDate() == null ? "Permanent" : "Temporary",
                    "isPermanent", ipBlacklistEntry.getExpiryDate() == null,
                    "blacklistType", "ip",
                    "blockedIp", clientIp
                ));
            } else if (phoneBlacklistEntry != null) {
                return ResponseEntity.ok(Map.of(
                    "blacklisted", true,
                    "reason", phoneBlacklistEntry.getReason(),
                    "expiryDate", phoneBlacklistEntry.getExpiryDate(),
                    "banType", phoneBlacklistEntry.getExpiryDate() == null ? "Permanent" : "Temporary",
                    "isPermanent", phoneBlacklistEntry.getExpiryDate() == null,
                    "blacklistType", "phone",
                    "blockedPhone", phoneNumber
                ));
            } else {
                return ResponseEntity.ok(Map.of("blacklisted", false));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to check blacklist status: " + e.getMessage()
            ));
        }
    }

    private String generateOtpCode() {
        return String.format("%06d", new SecureRandom().nextInt(1_000_000));
    }

    private ResponseEntity<Map<String, Object>> issueAuthResponse(
            HttpServletResponse response, User user, String accessToken, String refreshToken) {
        authCookieService.setAuthCookies(response, accessToken, refreshToken);
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("message", "Authenticated");
        body.put("authenticated", true);
        if (user.getRole() != null) {
            body.put("roles", "ROLE_" + user.getRole().getName());
            body.put("permissions", user.getRole().getPermissions().stream()
                    .map(com.Ojt.Ecommerce.entity.Permission::getKey)
                    .collect(java.util.stream.Collectors.joining(",")));
        }
        return ResponseEntity.ok(body);
    }
}