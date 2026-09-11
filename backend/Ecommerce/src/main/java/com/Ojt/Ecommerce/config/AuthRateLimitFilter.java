package com.Ojt.Ecommerce.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.Ojt.Ecommerce.util.IpLocationUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory per-IP rate limiter for auth endpoints.
 * Configure via app.rate-limit.auth.* properties. For multi-instance production, use Redis.
 */
@Component
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

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();
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
        long windowMs = 60_000L;
        long now = Instant.now().toEpochMilli();

        WindowCounter counter = counters.compute(clientKey, (key, existing) -> {
            if (existing == null || now - existing.windowStartMs >= windowMs) {
                return new WindowCounter(now, new AtomicInteger(0));
            }
            return existing;
        });

        int count = counter.count.incrementAndGet();
        if (count > requestsPerMinute) {
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

    private static final class WindowCounter {
        private final long windowStartMs;
        private final AtomicInteger count;

        private WindowCounter(long windowStartMs, AtomicInteger count) {
            this.windowStartMs = windowStartMs;
            this.count = count;
        }
    }
}
