package com.Ojt.Ecommerce.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CardMaskingUtilTest {

    @Test
    void extractLastFour_fromFullPan() {
        assertEquals("4242", CardMaskingUtil.extractLastFour("4111-1111-1111-4242"));
    }

    @Test
    void maskForDisplay_stripsLegacyFullPan() {
        assertEquals("4242", CardMaskingUtil.maskForDisplay("4111111111114242"));
    }

    @Test
    void extractLastFour_rejectsShortInput() {
        assertThrows(IllegalArgumentException.class, () -> CardMaskingUtil.extractLastFour("123"));
    }
}
