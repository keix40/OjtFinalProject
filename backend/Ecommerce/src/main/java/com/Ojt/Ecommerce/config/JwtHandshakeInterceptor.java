package com.Ojt.Ecommerce.config;

import com.Ojt.Ecommerce.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.security.Principal;
import java.util.Map;

public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtHandshakeInterceptor(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {

        // ✅ Convert to HttpServletRequest to access real request data
        if (request instanceof ServletServerHttpRequest) {
            HttpServletRequest servletRequest = ((ServletServerHttpRequest) request).getServletRequest();

            // ✅ Try to get token from query parameter (for SockJS compatibility)
            String token = servletRequest.getParameter("token");

            if (token != null) {
                System.out.println("[WebSocket] Received token: " + token);
                if (jwtTokenProvider.validateToken(token)) {
                    String username = jwtTokenProvider.getEmailFromToken(token);
                    System.out.println("[WebSocket] Token valid, username: " + username);
                    attributes.put("username", username); // ✅ Store for Principal
                } else {
                    System.out.println("[WebSocket] Invalid token received");
                }
            } else {
                System.out.println("[WebSocket] No token found in request");
            }
        }

        return true; // Let the handshake continue
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {}
}