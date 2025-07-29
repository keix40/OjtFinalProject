package com.Ojt.Ecommerce.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PhoneNumberUtilTest {

    @Test
    void testMyanmarPhoneNumberFormatting() {
        // Test Myanmar local format (09xxxxxxxx)
        assertEquals("+95912345678", PhoneNumberUtil.formatToE164("0912345678"));
        assertEquals("+95912345678", PhoneNumberUtil.formatToE164("09 12 34 56 78"));
        assertEquals("+95912345678", PhoneNumberUtil.formatToE164("09-12-34-56-78"));
        
        // Test Myanmar local format (9xxxxxxxx)
        assertEquals("+95912345678", PhoneNumberUtil.formatToE164("912345678"));
        
        // Test already formatted numbers
        assertEquals("+95912345678", PhoneNumberUtil.formatToE164("+95912345678"));
        
        // Test other international numbers
        assertEquals("+1234567890", PhoneNumberUtil.formatToE164("1234567890"));
        assertEquals("+44123456789", PhoneNumberUtil.formatToE164("+44123456789"));
    }

    @Test
    void testPhoneNumberValidation() {
        // Valid Myanmar numbers
        assertTrue(PhoneNumberUtil.isValidPhoneNumber("0912345678"));
        assertTrue(PhoneNumberUtil.isValidPhoneNumber("912345678"));
        assertTrue(PhoneNumberUtil.isValidPhoneNumber("+95912345678"));
        
        // Valid international numbers
        assertTrue(PhoneNumberUtil.isValidPhoneNumber("+1234567890"));
        assertTrue(PhoneNumberUtil.isValidPhoneNumber("+44123456789"));
        
        // Invalid numbers
        assertFalse(PhoneNumberUtil.isValidPhoneNumber("123456"));
        assertFalse(PhoneNumberUtil.isValidPhoneNumber("abc"));
        assertFalse(PhoneNumberUtil.isValidPhoneNumber(""));
        assertFalse(PhoneNumberUtil.isValidPhoneNumber(null));
    }

    @Test
    void testMyanmarNumberDetection() {
        // Myanmar numbers
        assertTrue(PhoneNumberUtil.isMyanmarNumber("0912345678"));
        assertTrue(PhoneNumberUtil.isMyanmarNumber("912345678"));
        assertTrue(PhoneNumberUtil.isMyanmarNumber("+95912345678"));
        
        // Non-Myanmar numbers
        assertFalse(PhoneNumberUtil.isMyanmarNumber("+1234567890"));
        assertFalse(PhoneNumberUtil.isMyanmarNumber("+44123456789"));
    }

    @Test
    void testDisplayFormat() {
        // Myanmar numbers with spacing
        assertEquals("+959 12 345 67", PhoneNumberUtil.getDisplayFormat("0912345678"));
        assertEquals("+959 12 345 67", PhoneNumberUtil.getDisplayFormat("+95912345678"));
        
        // Other numbers remain unchanged
        assertEquals("+1234567890", PhoneNumberUtil.getDisplayFormat("+1234567890"));
    }

    @Test
    void testEdgeCases() {
        // Null and empty
        assertEquals(null, PhoneNumberUtil.formatToE164(null));
        assertEquals("", PhoneNumberUtil.formatToE164(""));
        assertEquals("   ", PhoneNumberUtil.formatToE164("   "));
        
        // Whitespace handling
        assertEquals("+95912345678", PhoneNumberUtil.formatToE164(" 09 12 34 56 78 "));
        
        // Already formatted
        assertEquals("+95912345678", PhoneNumberUtil.formatToE164("+95912345678"));
    }
} 