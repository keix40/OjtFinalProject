package com.Ojt.Ecommerce.config;

import com.Ojt.Ecommerce.dto.UserDTO;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import com.Ojt.Ecommerce.service.BlacklistService;
import com.Ojt.Ecommerce.service.UserDetailsServiceImpl;
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
import java.util.List;
import java.util.stream.Collectors;
import com.Ojt.Ecommerce.entity.BlacklistEntry;
import com.Ojt.Ecommerce.service.BlacklistService;
import com.Ojt.Ecommerce.service.TokenBlacklistService;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsServiceImpl userDetailsService;
    private final TokenBlacklistService tokenBlacklistService;
    private final BlacklistService blacklistService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        String method = request.getMethod();
        
        // Completely skip JWT authentication for appeal endpoints
        if (requestURI.equals("/api/appeals/submit") && "POST".equals(method)) {
            logger.info("Skipping JWT authentication for appeal submission: {} {}", method, requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");

        logger.info("HEADER => {}", header);

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtTokenProvider.validateToken(token)) {
                if (tokenBlacklistService.isTokenBlacklisted(token)) {
                    logger.warn("Token is blacklisted => {}", token);
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("Token has been blacklisted (logged out)");
                    return;  // Stop further processing
                }
                String email = jwtTokenProvider.getEmailFromToken(token);
                logger.info("Extracted EMAIL from token => {}", email);

                String rolesString = jwtTokenProvider.getRolesFromToken(token);

//                List<SimpleGrantedAuthority> authorities = Arrays.stream(rolesString.split(","))
//                        .map(role -> new SimpleGrantedAuthority(role))  // If roles already have ROLE_ prefix
//                        .collect(Collectors.toList());

                //add this
                List<SimpleGrantedAuthority> authorities = rolesString == null ? new ArrayList<>() :
                        Arrays.stream(rolesString.split(","))
                                .map(SimpleGrantedAuthority::new)
                                .collect(Collectors.toList());

                // Parse permissions claim (new) 20.6.25
                Claims claims = jwtTokenProvider.parseClaims(token);
                String permissionsString = claims.get("permissions", String.class);
                if (permissionsString != null && !permissionsString.isEmpty()) {
                    List<SimpleGrantedAuthority> permissionAuthorities = Arrays.stream(permissionsString.split(","))
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());
                    authorities.addAll(permissionAuthorities);
                }

                // Blacklist check: block blacklisted users from accessing any protected endpoints
                try {
                    String userEmail = jwtTokenProvider.getEmailFromToken(token);
                    BlacklistEntry blacklistEntry = blacklistService.getActiveBlacklistByEmail(userEmail);
                    
                    // Also check for APPEALED status - user should still be blocked while appeal is pending
                    if (blacklistEntry == null) {
                        blacklistEntry = blacklistService.getBlacklistByEmailAndStatus(userEmail, BlacklistEntry.Status.APPEALED);
                    }
                    
                    if (blacklistEntry != null) {
                        logger.warn("Blacklisted/Appealed user attempting to access protected endpoint: {}", userEmail);
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        
                        // Create response with proper format
                        String banType = blacklistEntry.getExpiryDate() == null ? "Permanent" : "Temporary";
                        String status = blacklistEntry.getStatus().toString();
                        String responseBody = String.format(
                            "{\"blocked\":true,\"reason\":\"%s\",\"expiryDate\":%s,\"banType\":\"%s\",\"isPermanent\":%s,\"status\":\"%s\"}",
                            blacklistEntry.getReason(),
                            blacklistEntry.getExpiryDate() != null ? "\"" + blacklistEntry.getExpiryDate().toString() + "\"" : "null",
                            banType,
                            blacklistEntry.getExpiryDate() == null ? "true" : "false",
                            status
                        );
                        
                        response.getWriter().write(responseBody);
                        return;  // Stop further processing
                    }
                } catch (Exception e) {
                    logger.error("Error checking blacklist status: {}", e.getMessage());
                    // Continue processing if blacklist check fails
                }

                // Load UserDetails instead of UserDTO for Spring Security compatibility
                var userDetails = userDetailsService.loadUserByUsername(email); 

                var authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, authorities);// change 

                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }
}
