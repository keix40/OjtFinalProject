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
import com.Ojt.Ecommerce.security.CustomUserDetails;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.service.ActivityLogService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
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

    // Configurable thresholds
    private static final int THREAT_SCORE_BLOCK_THRESHOLD = 60; // 60 = high, 80 = critical
    private static final int ATTEMPT_WINDOW_MINUTES = 5;


    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> register(
            @RequestPart("user") RegisterRequest request,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage) {

        String result = userService.register(request, profileImage);
        return ResponseEntity.ok(Map.of("message", result));
    }




//    @LogActivity(actionType = "LOGIN", entityType = "USER", description = "User login", severityLevel = "LOW")
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, Object> loginRequest, HttpServletRequest request) {
        // Start timing for duration tracking
        java.time.LocalDateTime startTime = java.time.LocalDateTime.now();
        
        String email = ((String)loginRequest.get("email")).trim().toLowerCase();
        String password = loginRequest.get("password") != null ? loginRequest.get("password").toString() : "";
        String ip = request.getRemoteAddr();
        System.out.println("[LoginAttempt] Detected client IP: " + ip);
        String location = loginRequest.getOrDefault("location", "").toString();
        boolean isVPN = false;
        boolean isProxy = false;
        try {
            String ipqsApiKey = "RL4UtL8bX86mxJKRY3nqYNGdlPrViZX";
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
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
            // If password is correct, check if OTP/CAPTCHA is required
            if (requireOtpCaptcha) {
                // Generate a login OTP (not email verification OTP)
                String otp = String.format("%06d", new java.util.Random().nextInt(999999));
                OtpVerification otpVerification = otpVerificationRepository.findByEmail(email)
                    .orElse(new OtpVerification());
                otpVerification.setEmail(email);
                otpVerification.setOtpCode(otp);
                otpVerification.setExpiryTime(LocalDateTime.now().plusMinutes(10));
                otpVerification.setVerified(false);
                otpVerification.setType("login"); // <-- distinguish from email verification
                otpVerificationRepository.save(otpVerification);
                emailService.sendEmail(email, "Your Login OTP Code", "Your OTP for login verification is: " + otp);
                return ResponseEntity.status(401).body(Map.of(
                    "otpRequired", true,
                    "captchaRequired", true,
                    "message", "OTP and CAPTCHA verification required for login."
                ));
            }
            SecurityContextHolder.getContext().setAuthentication(authentication);
            org.springframework.security.core.userdetails.User springUser =
                    (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
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
            String activityMsg = "Successful login for " + email + " from IP " + ip + (isVPN ? " [VPN detected]" : "") + (isProxy ? " [Proxy detected]" : "");
            messagingTemplate.convertAndSend("/topic/activity-feed", Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "type", isVPN || isProxy ? "warning" : "success",
                "message", activityMsg
            ));
            // Reset OTP/CAPTCHA for this IP
            loginAttemptService.handleSuccessfulLogin(ip);
            String accessToken = jwtTokenProvider.generateToken(user);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
            // --- MANUAL ACTIVITY LOGGING FOR LOGIN ---
            java.time.LocalDateTime endTime = java.time.LocalDateTime.now();
            java.time.Duration duration = java.time.Duration.between(startTime, endTime);
            long durationMillis = duration.toMillis();
            
            // Get real user location
            String userLocation = getUserLocation(ip);
            
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
                getClientIpAddress(request),
                request.getHeader("User-Agent"),
                request.getSession().getId()
            );
            log.setDetails(detailsJson);
            activityLogService.createActivityLog(log);
            System.out.println("Activity log insert called.");
            // --- END MANUAL LOGGING ---
            return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken.getToken()
            ));
        } catch (Exception ex) {
            // Save failed attempt
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
            // --- Broadcast real-time activity feed event ---
            String activityMsg = "Failed login for " + email + " from IP " + ip + (isVPN ? " [VPN detected]" : "") + (isProxy ? " [Proxy detected]" : "");
            messagingTemplate.convertAndSend("/topic/activity-feed", Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "type", isVPN || isProxy ? "danger" : "warning",
                "message", activityMsg
            ));
            // Progressive security logic
            loginAttemptService.handleFailedLogin(email, ip, location);
            throw ex;
        }
    }

    // Utility to extract real client IP (prefers X-Client-IP, then X-Debug-IP, then X-Forwarded-For, then remoteAddr)
    private String extractClientIp(HttpServletRequest request) {
        String clientIp = request.getHeader("X-Client-IP");
        if (clientIp != null && !clientIp.isEmpty() && isPublicIp(clientIp.trim())) {
            return clientIp.trim();
        }
        String debugIp = request.getHeader("X-Debug-IP");
        if (debugIp != null && !debugIp.isEmpty()) {
            return debugIp.trim();
        }
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
    // Helper to check if IP is public
    private boolean isPublicIp(String ip) {
        return !(ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.16.") || ip.equals("127.0.0.1") || ip.equals("::1"));
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

    private String getUserLocation(String ipAddress) {
        if ("unknown".equals(ipAddress) || ipAddress == null || ipAddress.isEmpty()) {
            return "Unknown Location";
        }
        
        // Handle localhost and local IPs
        if ("127.0.0.1".equals(ipAddress) || "0:0:0:0:0:0:0:1".equals(ipAddress) || 
            "localhost".equals(ipAddress) || ipAddress.startsWith("192.168.") || 
            ipAddress.startsWith("10.") || ipAddress.startsWith("172.16.")) {
            return "Local Development";
        }
        
        try {
            // Use a free IP geolocation service
            String apiUrl = "http://ip-api.com/json/" + ipAddress;
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create(apiUrl))
                .build();
            
            java.net.http.HttpResponse<String> response = client.send(request, 
                java.net.http.HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                String responseBody = response.body();
                // Parse JSON response to extract location
                if (responseBody.contains("\"status\":\"success\"")) {
                    // Extract city and country from response
                    String city = extractJsonValue(responseBody, "city");
                    String country = extractJsonValue(responseBody, "country");
                    String region = extractJsonValue(responseBody, "regionName");
                    
                    if (city != null && country != null) {
                        return city + ", " + country;
                    } else if (region != null && country != null) {
                        return region + ", " + country;
                    } else if (country != null) {
                        return country;
                    }
                }
            }
        } catch (Exception e) {
            // Log error but don't fail the operation
            System.err.println("Error getting location for IP " + ipAddress + ": " + e.getMessage());
        }
        
        return "Unknown Location";
    }
    
    private String extractJsonValue(String json, String key) {
        try {
            String pattern = "\"" + key + "\":\"([^\"]+)\"";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(json);
            if (m.find()) {
                return m.group(1);
            }
        } catch (Exception e) {
            // Ignore parsing errors
        }
        return null;
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

    @LogActivity(actionType = "LOGOUT", entityType = "USER", description = "User logout", severityLevel = "LOW")
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
        if (!"login".equals(otpVerification.getType())) {
            throw new CustomException("This OTP is not for login verification.");
        }
        if (otpVerification.isVerified()) {
            return ResponseEntity.ok(Map.of("message", "Login already verified."));
        }
        if (!otpVerification.getOtpCode().equals(otp)) {
            throw new CustomException("Invalid OTP.");
        }
        if (otpVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new CustomException("OTP has expired.");
        }
        otpVerification.setVerified(true);
        otpVerificationRepository.save(otpVerification);
        // Generate JWT and refresh token for seamless login
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found"));
        String accessToken = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
        return ResponseEntity.ok(new LoginResponse(accessToken, refreshToken.getToken()));
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

    @PostMapping("/validate-real-email")
    public ResponseEntity<?> validateRealEmail(@RequestBody EmailRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        boolean isReal = emailVerificationService.isEmailReal(email);
        if (isReal) {
            return ResponseEntity.ok(Map.of("real", true, "message", "Email is real/active."));
        } else {
            return ResponseEntity.ok(Map.of("real", false, "message", "Email does not exist or is not active."));
        }
    }

    @PostMapping("/send-login-otp")
    public ResponseEntity<?> sendLoginOtp(@RequestBody EmailRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new CustomException("Invalid email format.");
        }
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new CustomException("No account found with this email.");
        }
        if (userOpt.get().isVerified()) {
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
        emailService.sendEmail(email, "Your Login OTP Code", "Your OTP for login verification is: " + otp);
        return ResponseEntity.ok(Map.of("message", "OTP sent to " + email));
    }
}