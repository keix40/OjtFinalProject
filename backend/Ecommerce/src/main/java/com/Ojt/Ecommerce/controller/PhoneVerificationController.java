package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.service.TwilioVerificationService;
import com.Ojt.Ecommerce.service.UserService;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.Ojt.Ecommerce.annotations.LogActivity;

import com.Ojt.Ecommerce.util.PhoneNumberUtil;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/phone-verification")
@RequiredArgsConstructor
@Slf4j
public class PhoneVerificationController {

    private final TwilioVerificationService twilioVerificationService;
    private final UserService userService;
    private final UserRepository userRepository;



    /**
     * Send OTP to phone number
     */
    @LogActivity(actionType = "CREATE", entityType = "PHONE_VERIFICATION", description = "Sent OTP", severityLevel = "LOW")
    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOTP(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Phone number is required");
            return ResponseEntity.badRequest().body(response);
        }
        
        // Format phone number to E.164 format
        String formattedPhoneNumber = PhoneNumberUtil.formatToE164(phoneNumber);
        
        // Validate phone number format
        if (!PhoneNumberUtil.isValidPhoneNumber(formattedPhoneNumber)) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Invalid phone number format. Please enter a valid phone number.");
            return ResponseEntity.badRequest().body(response);
        }

        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        
        try {
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if phone number is already verified for another user
            User existingUser = userRepository.findByPhoneNumber(formattedPhoneNumber)
                    .orElse(null);
            
            if (existingUser != null && existingUser.getId() != user.getId()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "This phone number is already registered with another account");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check if user is trying to change their phone number
            String currentPhoneNumber = user.getPhoneNumber();
            boolean isChangingPhoneNumber = currentPhoneNumber != null && 
                                          !currentPhoneNumber.trim().isEmpty() && 
                                          !formattedPhoneNumber.equals(currentPhoneNumber);
            
            if (isChangingPhoneNumber) {
                log.info("User {} is changing phone number from {} to {}", 
                        user.getEmail(), currentPhoneNumber, formattedPhoneNumber);
            }

            // Generate OTP
            String otpCode = twilioVerificationService.generateOTP();
            
            // Send OTP via SMS (TEMPORARILY DISABLED - OTP will be shown in console for testing)
            String messageSid = twilioVerificationService.sendOTP(formattedPhoneNumber, otpCode);
            
            if (messageSid != null) {
                // Save OTP to user
                user.setOtpCode(otpCode);
                user.setOtpExpiry(LocalDateTime.now().plusMinutes(10)); // OTP expires in 10 minutes
                userRepository.save(user);
                
                log.info("OTP sent for testing - Check console for OTP code: {}", otpCode);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "OTP sent successfully to " + PhoneNumberUtil.getDisplayFormat(formattedPhoneNumber));
                response.put("messageSid", messageSid);
                response.put("formattedPhoneNumber", formattedPhoneNumber);
                response.put("isChangingPhoneNumber", isChangingPhoneNumber);
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Failed to send OTP. Please check your phone number and try again.");
                return ResponseEntity.ok(response);
            }
            
        } catch (Exception e) {
            log.error("Error sending OTP: ", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An error occurred while sending OTP. Please try again.");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Verify OTP and update phone number
     */
    @LogActivity(actionType = "UPDATE", entityType = "PHONE_VERIFICATION", description = "Verified OTP", severityLevel = "LOW", logChanges = true)
    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOTP(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        String otpCode = request.get("otpCode");
        
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Phone number is required");
            return ResponseEntity.badRequest().body(response);
        }
        
        // Format phone number to E.164 format
        String formattedPhoneNumber = PhoneNumberUtil.formatToE164(phoneNumber);
        
        // Validate phone number format
        if (!PhoneNumberUtil.isValidPhoneNumber(formattedPhoneNumber)) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Invalid phone number format. Please enter a valid phone number.");
            return ResponseEntity.badRequest().body(response);
        }
        
        if (otpCode == null || otpCode.trim().isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "OTP code is required");
            return ResponseEntity.badRequest().body(response);
        }

        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        
        try {
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if OTP is expired
            if (user.getOtpExpiry() == null || LocalDateTime.now().isAfter(user.getOtpExpiry())) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "OTP has expired. Please request a new OTP.");
                return ResponseEntity.badRequest().body(response);
            }

            // Check if OTP matches
            if (!otpCode.equals(user.getOtpCode())) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Invalid OTP code. Please check and try again.");
                return ResponseEntity.badRequest().body(response);
            }

            // Check if user is changing their phone number
            String currentPhoneNumber = user.getPhoneNumber();
            boolean isChangingPhoneNumber = currentPhoneNumber != null && 
                                          !currentPhoneNumber.trim().isEmpty() && 
                                          !formattedPhoneNumber.equals(currentPhoneNumber);
            
            // Update user's phone number and mark as verified
            user.setPhoneNumber(formattedPhoneNumber);
            user.setPhoneVerified(true); // Mark phone as verified
            user.setOtpCode(null); // Clear OTP after successful verification
            user.setOtpExpiry(null); // Clear OTP expiry
            userRepository.save(user);
            
            if (isChangingPhoneNumber) {
                log.info("User {} successfully changed phone number from {} to {}", 
                        user.getEmail(), currentPhoneNumber, formattedPhoneNumber);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Phone number verified successfully!");
            response.put("phoneNumber", formattedPhoneNumber);
            response.put("displayPhoneNumber", PhoneNumberUtil.getDisplayFormat(formattedPhoneNumber));
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error verifying OTP: ", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An error occurred while verifying OTP. Please try again.");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Check phone verification status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getPhoneVerificationStatus() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        
        try {
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("phoneNumber", user.getPhoneNumber());
            response.put("phoneVerified", user.isPhoneVerified());
            response.put("hasOtpExpiry", user.getOtpExpiry() != null);
            response.put("otpExpired", user.getOtpExpiry() != null && LocalDateTime.now().isAfter(user.getOtpExpiry()));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting phone verification status: ", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An error occurred while getting phone verification status.");
            return ResponseEntity.internalServerError().body(response);
        }
    }
} 