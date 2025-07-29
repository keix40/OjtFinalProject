package com.Ojt.Ecommerce.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.Random;

@Service
@Slf4j
public class TwilioVerificationService {
    private final String accountSid;
    private final String authToken;
    private final String twilioPhoneNumber;

    public TwilioVerificationService(
            @Value("${twilio.account_sid}") String accountSid,
            @Value("${twilio.auth_token}") String authToken,
            @Value("${twilio.phone_number}") String twilioPhoneNumber) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.twilioPhoneNumber = twilioPhoneNumber;

        // Initialize Twilio once when service is created
        Twilio.init(accountSid, authToken);
        log.info("Twilio verification service initialized successfully");
    }

    /**
     * Generate a 6-digit OTP code
     * @return 6-digit OTP string
     */
    public String generateOTP() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000); // Generates 6-digit number between 100000-999999
        return String.valueOf(otp);
    }

    public String sendOTP(String phoneNumber, String otpCode) {
        // TEMPORARILY COMMENTED OUT TO SAVE TWILIO CREDITS
        // String messageBody = "Your verification code is: " + otpCode + ". Please enter this code to verify your phone number. This code will expire in 10 minutes.";
        // return sendSms(phoneNumber, messageBody);
        
        // Console output for testing
        System.out.println("=== OTP FOR TESTING ===");
        System.out.println("Phone Number: " + phoneNumber);
        System.out.println("OTP Code: " + otpCode);
        System.out.println("=======================");
        
        // Return a dummy message SID for testing
        return "TEST_MSG_" + System.currentTimeMillis();
    }

    /**
     * Send SMS message using Twilio
     * @param to Recipient phone number (should include country code)
     * @param messageBody The message content
     * @return Message SID if successful, null if failed
     */
    public String sendSms(String to, String messageBody) {
        try {
            Message message = Message.creator(
                            new PhoneNumber(to),
                            new PhoneNumber(twilioPhoneNumber),
                            messageBody)
                    .create();

            log.info("SMS sent successfully to {} with SID: {}", to, message.getSid());
            return message.getSid();
        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", to, e.getMessage());
            return null;
        }
    }

    public boolean isConfigured() {
        return accountSid != null && !accountSid.isEmpty() && 
               authToken != null && !authToken.isEmpty() && 
               twilioPhoneNumber != null && !twilioPhoneNumber.isEmpty();
    }
}
