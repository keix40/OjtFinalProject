package com.Ojt.Ecommerce.util;

import java.util.regex.Pattern;

public class PhoneNumberUtil {
    
    // Pattern for Myanmar phone numbers starting with 09 (10 digits total)
    private static final Pattern MYANMAR_PHONE_PATTERN = Pattern.compile("^09\\d{8}$");
    
    // Pattern for Myanmar phone numbers starting with 9 (9 digits total)
    private static final Pattern MYANMAR_PHONE_PATTERN_9 = Pattern.compile("^9\\d{8}$");
    
    // Pattern for Myanmar phone numbers starting with +959 (12-13 digits total including +)
    private static final Pattern MYANMAR_PHONE_PATTERN_E164 = Pattern.compile("^\\+959\\d{8,9}$");
    
    // Pattern for Myanmar phone numbers starting with 09 (11 digits total - for longer numbers)
    private static final Pattern MYANMAR_PHONE_PATTERN_LONG = Pattern.compile("^09\\d{9}$");
    
    // Pattern for general E.164 format
    private static final Pattern E164_PATTERN = Pattern.compile("^\\+[1-9]\\d{1,14}$");
    
    /**
     * Convert phone number to E.164 format
     * @param phoneNumber The phone number to convert
     * @return E.164 formatted phone number
     */
    public static String formatToE164(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return phoneNumber;
        }
        
        String cleaned = phoneNumber.trim().replaceAll("\\s+", "");
        
        // If already in E.164 format, return as is
        if (E164_PATTERN.matcher(cleaned).matches()) {
            return cleaned;
        }
        
        // Convert Myanmar local format (09xxxxxxxx) to E.164 (+959xxxxxxxx) - 10 digits
        if (MYANMAR_PHONE_PATTERN.matcher(cleaned).matches()) {
            return "+959" + cleaned.substring(2); // Remove 09 and add +959
        }
        
        // Convert Myanmar local format (09xxxxxxxxx) to E.164 (+959xxxxxxxxx) - 11 digits
        if (MYANMAR_PHONE_PATTERN_LONG.matcher(cleaned).matches()) {
            return "+959" + cleaned.substring(2); // Remove 09 and add +959
        }
        
        // Convert Myanmar local format (9xxxxxxxx) to E.164 (+959xxxxxxxx)
        if (MYANMAR_PHONE_PATTERN_9.matcher(cleaned).matches()) {
            return "+959" + cleaned.substring(1); // Remove 9 and add +959
        }
        
        // If it's already in Myanmar E.164 format, return as is
        if (MYANMAR_PHONE_PATTERN_E164.matcher(cleaned).matches()) {
            return cleaned;
        }
        
        // For other formats, try to add + if not present
        if (!cleaned.startsWith("+")) {
            // If it starts with a number, assume it's a local number
            if (cleaned.matches("^\\d+$")) {
                // For now, assume it's Myanmar if it's 9 digits starting with 9
                if (cleaned.length() == 9 && cleaned.startsWith("9")) {
                    return "+959" + cleaned;
                }
                // For other cases, just add + (user should specify country code)
                return "+" + cleaned;
            }
        }
        
        // Return as is if no conversion rules apply
        return cleaned;
    }
    
    /**
     * Validate if phone number is in valid format
     * @param phoneNumber The phone number to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValidPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return false;
        }
        
        String formatted = formatToE164(phoneNumber);
        return E164_PATTERN.matcher(formatted).matches();
    }
    
    /**
     * Get formatted phone number for display
     * @param phoneNumber The phone number to format
     * @return Formatted phone number for display
     */
    public static String getDisplayFormat(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return phoneNumber;
        }
        
        String e164 = formatToE164(phoneNumber);
        
        // For Myanmar numbers, show in a more readable format
        if (e164.startsWith("+959")) {
            String number = e164.substring(4); // Remove +959
            if (number.length() == 8) {
                return "+959 " + number.substring(0, 2) + " " + number.substring(2, 5) + " " + number.substring(5);
            } else if (number.length() == 9) {
                return "+959 " + number.substring(0, 2) + " " + number.substring(2, 5) + " " + number.substring(5);
            }
        }
        
        return e164;
    }
    
    /**
     * Check if phone number is Myanmar format
     * @param phoneNumber The phone number to check
     * @return true if Myanmar number, false otherwise
     */
    public static boolean isMyanmarNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return false;
        }
        
        String cleaned = phoneNumber.trim().replaceAll("\\s+", "");
        return MYANMAR_PHONE_PATTERN.matcher(cleaned).matches() ||
               MYANMAR_PHONE_PATTERN_LONG.matcher(cleaned).matches() ||
               MYANMAR_PHONE_PATTERN_9.matcher(cleaned).matches() ||
               MYANMAR_PHONE_PATTERN_E164.matcher(cleaned).matches();
    }
} 