package com.Ojt.Ecommerce.config;

import com.Ojt.Ecommerce.security.AuthCookieService;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.socket.WebSocketHandler;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtHandshakeInterceptorTest {

    @Test
    void rejectsHandshakeWithoutToken() {
        JwtTokenProvider jwt = mock(JwtTokenProvider.class);
        AuthCookieService cookies = mock(AuthCookieService.class);
        when(cookies.getAccessToken(any())).thenReturn(Optional.empty());

        JwtHandshakeInterceptor interceptor = new JwtHandshakeInterceptor(jwt, cookies);
        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        ServletServerHttpRequest request = new ServletServerHttpRequest(servletRequest);
        Map<String, Object> attributes = new HashMap<>();

        assertFalse(interceptor.beforeHandshake(request, mock(ServerHttpResponse.class),
                mock(WebSocketHandler.class), attributes));
    }

    @Test
    void acceptsHandshakeWithValidCookieToken() {
        JwtTokenProvider jwt = mock(JwtTokenProvider.class);
        AuthCookieService cookies = mock(AuthCookieService.class);
        when(cookies.getAccessToken(any())).thenReturn(Optional.of("valid-token"));
        when(jwt.validateToken("valid-token")).thenReturn(true);
        when(jwt.getEmailFromToken("valid-token")).thenReturn("user@test.com");

        JwtHandshakeInterceptor interceptor = new JwtHandshakeInterceptor(jwt, cookies);
        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        ServletServerHttpRequest request = new ServletServerHttpRequest(servletRequest);
        Map<String, Object> attributes = new HashMap<>();

        assertTrue(interceptor.beforeHandshake(request, mock(ServerHttpResponse.class),
                mock(WebSocketHandler.class), attributes));
        org.junit.jupiter.api.Assertions.assertEquals("user@test.com", attributes.get("username"));
    }
}
