package com.Ojt.Ecommerce.config;

import com.Ojt.Ecommerce.service.LoginAttemptService;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(1) // High priority - check IP ban before other filters
public class IPBanFilter implements Filter {

    private final LoginAttemptService loginAttemptService;

    // Endpoints that should be allowed even if IP is banned (for essential services)
    private static final List<String> ALLOWED_ENDPOINTS = Arrays.asList(
        "/api/auth/login",           // Allow login to show ban message
        "/api/auth/register",        // Allow registration
        "/api/auth/verify",          // Allow email verification
        "/api/auth/verify-otp",      // Allow OTP verification
        "/api/auth/resend-otp",      // Allow OTP resend
        "/api/auth/forgot-password", // Allow password reset
        "/api/auth/reset-password",  // Allow password reset
        "/api/auth/check-blacklist-status", // Allow blacklist status check
        "/error",                    // Allow error pages
        "/favicon.ico",              // Allow favicon
        "/api/health",               // Allow health checks
        "/api/public"                // Allow public endpoints
    );

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String requestURI = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();
        
        // Skip IP ban check for allowed endpoints
        if (isAllowedEndpoint(requestURI)) {
            chain.doFilter(request, response);
            return;
        }
        
        // Get client IP address
        String clientIP = getClientIPAddress(httpRequest);
        
        // Check if IP is banned
        if (loginAttemptService.isIPBlocked(clientIP)) {
            log.warn("Blocked request from banned IP: {} to endpoint: {} {}", 
                    clientIP, method, requestURI);
            
            httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
            httpResponse.setContentType("application/json");
            
            // Return JSON response with ban information
            String banResponse = String.format(
                "{\"banned\":true,\"message\":\"Your IP address (%s) is temporarily banned due to suspicious activity.\",\"ip\":\"%s\"}",
                clientIP, clientIP
            );
            
            httpResponse.getWriter().write(banResponse);
            return;
        }
        
        // IP is not banned, continue with the request
        chain.doFilter(request, response);
    }
    
    private boolean isAllowedEndpoint(String requestURI) {
        return ALLOWED_ENDPOINTS.stream()
                .anyMatch(endpoint -> requestURI.startsWith(endpoint));
    }
    
    private String getClientIPAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty() && !"unknown".equalsIgnoreCase(xRealIP)) {
            return xRealIP;
        }
        
        return request.getRemoteAddr();
    }
} 