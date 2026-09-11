package com.Ojt.Ecommerce.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Optional;

@Service
public class AuthCookieService {

    @Value("${app.auth.cookie.access-name:access_token}")
    private String accessCookieName;

    @Value("${app.auth.cookie.refresh-name:refresh_token}")
    private String refreshCookieName;

    @Value("${app.auth.cookie.secure:false}")
    private boolean secure;

    @Value("${app.auth.cookie.same-site:Lax}")
    private String sameSite;

    @Value("${app.auth.cookie.domain:}")
    private String domain;

    @Value("${app.jwt.expiration:86400000}")
    private long accessTokenMaxAgeMs;

    @Value("${jwt.refresh.expiration:604800000}")
    private long refreshTokenMaxAgeMs;

    public void setAuthCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        addCookie(response, accessCookieName, accessToken, accessTokenMaxAgeMs / 1000);
        if (refreshToken != null && !refreshToken.isBlank()) {
            addCookie(response, refreshCookieName, refreshToken, refreshTokenMaxAgeMs / 1000);
        }
    }

    public void clearAuthCookies(HttpServletResponse response) {
        addCookie(response, accessCookieName, "", 0);
        addCookie(response, refreshCookieName, "", 0);
    }

    public Optional<String> getAccessToken(HttpServletRequest request) {
        return getCookieValue(request, accessCookieName);
    }

    public Optional<String> getRefreshToken(HttpServletRequest request) {
        return getCookieValue(request, refreshCookieName);
    }

    private Optional<String> getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .filter(v -> v != null && !v.isBlank())
                .findFirst();
    }

    private void addCookie(HttpServletResponse response, String name, String value, long maxAgeSeconds) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(maxAgeSeconds)
                .sameSite(sameSite);
        if (domain != null && !domain.isBlank()) {
            builder.domain(domain);
        }
        response.addHeader("Set-Cookie", builder.build().toString());
    }
}
