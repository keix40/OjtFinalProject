package com.Ojt.Ecommerce.config;

import com.Ojt.Ecommerce.entity.BlacklistEntry;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class JwtAuthenticationFilterBlacklistResponseTest {

    private ObjectMapper objectMapper;
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        filter = new JwtAuthenticationFilter(
                mock(com.Ojt.Ecommerce.security.JwtTokenProvider.class),
                mock(com.Ojt.Ecommerce.service.UserDetailsServiceImpl.class),
                mock(com.Ojt.Ecommerce.service.TokenBlacklistService.class),
                mock(com.Ojt.Ecommerce.service.BlacklistService.class),
                mock(com.Ojt.Ecommerce.security.AuthCookieService.class),
                objectMapper
        );
    }

    @Test
    void reasonContainingQuotesAndControlCharsIsValidJson() throws Exception {
        BlacklistEntry entry = new BlacklistEntry();
        entry.setReason("Violated \"terms\" and policy\nline2");
        entry.setStatus(BlacklistEntry.Status.ACTIVE);
        entry.setExpiryDate(LocalDateTime.of(2026, 1, 15, 12, 0));

        String json = filter.serializeBlacklistResponse(entry);
        JsonNode node = objectMapper.readTree(json);

        assertTrue(node.get("blocked").asBoolean());
        assertEquals("Violated \"terms\" and policy\nline2", node.get("reason").asText());
        assertEquals("Temporary", node.get("banType").asText());
        assertFalse(node.get("isPermanent").asBoolean());
        assertEquals("ACTIVE", node.get("status").asText());
        assertFalse(node.get("expiryDate").isNull());
    }

    @Test
    void permanentBanUsesNullExpiryAndPermanentFlags() throws Exception {
        BlacklistEntry entry = new BlacklistEntry();
        entry.setReason("Fraud");
        entry.setStatus(BlacklistEntry.Status.ACTIVE);
        entry.setExpiryDate(null);

        String json = filter.serializeBlacklistResponse(entry);
        JsonNode node = objectMapper.readTree(json);

        assertEquals("Permanent", node.get("banType").asText());
        assertTrue(node.get("isPermanent").asBoolean());
        assertTrue(node.get("expiryDate").isNull());
    }
}
