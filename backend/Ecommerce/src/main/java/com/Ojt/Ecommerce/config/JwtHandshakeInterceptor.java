package com.Ojt.Ecommerce.config;

import com.Ojt.Ecommerce.security.AuthCookieService;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * Rejects WebSocket handshakes without a valid JWT (HttpOnly cookie or legacy query token).
 * No intentionally public STOMP topics — all connections require authentication.
 */
@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(JwtHandshakeInterceptor.class);

    private final JwtTokenProvider jwtTokenProvider;
    private final AuthCookieService authCookieService;

    public JwtHandshakeInterceptor(JwtTokenProvider jwtTokenProvider, AuthCookieService authCookieService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.authCookieService = authCookieService;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            log.warn("[WebSocket] Rejected handshake: not a servlet request");
            return false;
        }

        HttpServletRequest httpRequest = servletRequest.getServletRequest();
        String token = resolveToken(httpRequest);
        if (token == null || !jwtTokenProvider.validateToken(token)) {
            log.warn("[WebSocket] Rejected unauthenticated handshake from {}", httpRequest.getRemoteAddr());
            return false;
        }

        String username = jwtTokenProvider.getEmailFromToken(token);
        attributes.put("username", username);
        return true;
    }

    private String resolveToken(HttpServletRequest request) {
        return authCookieService.getAccessToken(request)
                .orElseGet(() -> {
                    String queryToken = request.getParameter("token");
                    return (queryToken != null && !queryToken.isBlank()) ? queryToken : null;
                });
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}
