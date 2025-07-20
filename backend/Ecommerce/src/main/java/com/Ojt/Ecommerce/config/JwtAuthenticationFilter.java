package com.Ojt.Ecommerce.config;

import com.Ojt.Ecommerce.dto.UserDTO;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import com.Ojt.Ecommerce.service.TokenBlacklistService;
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

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsServiceImpl userDetailsService;
    private final TokenBlacklistService tokenBlacklistService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

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
                // var userDetails = userDetailsService.loadUserByUsername(email);
                // Load User entity and map to UserDTO
                com.Ojt.Ecommerce.entity.User userEntity = userRepository.findByEmail(email).orElse(null);
                UserDTO userDTO = userEntity != null ? new UserDTO(userEntity) : null;

                var authentication = new UsernamePasswordAuthenticationToken(
                        userDTO, null, authorities);

                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }
}
