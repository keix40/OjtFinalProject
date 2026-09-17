package com.Ojt.Ecommerce.config;

import com.Ojt.Ecommerce.entity.BlacklistEntry;
import com.Ojt.Ecommerce.security.AuthCookieService;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import com.Ojt.Ecommerce.service.BlacklistService;
import com.Ojt.Ecommerce.service.TokenBlacklistService;
import com.Ojt.Ecommerce.service.UserDetailsServiceImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsServiceImpl userDetailsService;
    private final TokenBlacklistService tokenBlacklistService;
    private final BlacklistService blacklistService;
    private final AuthCookieService authCookieService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        String method = request.getMethod();

        if (requestURI.equals("/api/appeals/submit") && "POST".equals(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = resolveToken(request);

        if (token != null && jwtTokenProvider.validateToken(token)) {
            if (tokenBlacklistService.isTokenBlacklisted(token)) {
                logger.warn("Blacklisted token rejected for {}", requestURI);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Token has been blacklisted (logged out)");
                return;
            }

            String email = jwtTokenProvider.getEmailFromToken(token);
            String rolesString = jwtTokenProvider.getRolesFromToken(token);

            List<SimpleGrantedAuthority> authorities = rolesString == null ? new ArrayList<>() :
                    Arrays.stream(rolesString.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());

            Claims claims = jwtTokenProvider.parseClaims(token);
            String permissionsString = claims.get("permissions", String.class);
            if (permissionsString != null && !permissionsString.isEmpty()) {
                List<SimpleGrantedAuthority> permissionAuthorities = Arrays.stream(permissionsString.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());
                authorities.addAll(permissionAuthorities);
            }

            try {
                BlacklistEntry blacklistEntry = blacklistService.getActiveBlacklistByEmail(email);
                if (blacklistEntry == null) {
                    blacklistEntry = blacklistService.getBlacklistByEmailAndStatus(email, BlacklistEntry.Status.APPEALED);
                }
                if (blacklistEntry != null) {
                    logger.warn("Blacklisted user blocked: {}", email);
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write(serializeBlacklistResponse(blacklistEntry));
                    return;
                }
            } catch (Exception e) {
                logger.error("Blacklist check failed: {}", e.getMessage());
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"message\":\"Unable to verify account status\"}");
                return;
            }

            var userDetails = userDetailsService.loadUserByUsername(email);
            var authentication = new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    String serializeBlacklistResponse(BlacklistEntry blacklistEntry) throws JsonProcessingException {
        String banType = blacklistEntry.getExpiryDate() == null ? "Permanent" : "Temporary";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("blocked", true);
        body.put("reason", blacklistEntry.getReason());
        body.put("expiryDate", blacklistEntry.getExpiryDate());
        body.put("banType", banType);
        body.put("isPermanent", blacklistEntry.getExpiryDate() == null);
        body.put("status", blacklistEntry.getStatus());
        return objectMapper.writeValueAsString(body);
    }

    private String resolveToken(HttpServletRequest request) {
        return authCookieService.getAccessToken(request)
                .or(() -> {
                    String header = request.getHeader("Authorization");
                    if (header != null && header.startsWith("Bearer ")) {
                        return java.util.Optional.of(header.substring(7));
                    }
                    return java.util.Optional.empty();
                })
                .orElse(null);
    }
}
