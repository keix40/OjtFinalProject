package com.Ojt.Ecommerce.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.servlet.FilterChain;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthRateLimitFilterTest {

    private AuthRateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter = new AuthRateLimitFilter(new InMemoryAuthRateLimitStore());
        ReflectionTestUtils.setField(filter, "requestsPerMinute", 2);
        ReflectionTestUtils.setField(filter, "enabled", true);
    }

    @Test
    void blocksAfterLimitExceeded() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("203.0.113.10");

        filter.doFilterInternal(request, new MockHttpServletResponse(), chain);
        filter.doFilterInternal(request, new MockHttpServletResponse(), chain);
        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilterInternal(request, blocked, chain);

        assertEquals(429, blocked.getStatus());
        verify(chain, times(2)).doFilter(any(), any());
    }
}
