package com.Ojt.Ecommerce.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.Ojt.Ecommerce.util.IpLocationUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * Per-IP rate limiter for auth endpoints. Uses Redis when app.redis.enabled=true, else in-memory.
 */
@Component
@RequiredArgsConstructor
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> LIMITED_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/verify-otp",
            "/api/auth/verify-login-otp",
            "/api/auth/resend-otp",
            "/api/auth/send-login-otp",
            "/api/auth/sendOtp",
            "/api/auth/send-reset-otp",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/refresh-token"
    );

    private final AuthRateLimitStore rateLimitStore;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.rate-limit.auth.requests-per-minute:30}")
    private int requestsPerMinute;

    @Value("${app.rate-limit.auth.enabled:true}")
    private boolean enabled;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!enabled || !"POST".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        if (!LIMITED_PATHS.contains(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientKey = IpLocationUtil.extractClientIp(request) + ":" + path;
        int count = rateLimitStore.incrementAndGet(clientKey, 60_000L, requestsPerMinute);
        if (count < 0) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(), Map.of(
                    "message", "Too many requests. Please try again later.",
                    "retryAfterSeconds", 60
            ));
            return;
        }

        filterChain.doFilter(request, response);
    }
}
