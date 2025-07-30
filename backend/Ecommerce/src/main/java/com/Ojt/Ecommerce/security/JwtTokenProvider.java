package com.Ojt.Ecommerce.security;

import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.entity.VipTier;
import com.Ojt.Ecommerce.repository.VipTierRepository;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class JwtTokenProvider implements InitializingBean {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final VipTierRepository vipTierRepository;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    private SecretKey secretKey;


    //adding more detail to show in token (kei)
    @Override
    public void afterPropertiesSet() {

        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        String roles = "ROLE_" + user.getRole().getName();
        String permissions = user.getRole().getRolePermissions().stream()
                .map(rolePermission -> rolePermission.getPermission().getKey())
                .collect(Collectors.joining(","));

        // --- VIP Tier logic ---
        VipTier vipTier = vipTierRepository.findTopByMinPointsLessThanEqualOrderByMinPointsDesc(
                user.getTotalPoints() != null ? user.getTotalPoints() : 0
        ).orElse(null);
        String vipTierName = vipTier != null ? vipTier.getName() : "Regular";

        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("id", user.getId())
                .claim("roles", roles)
                .claim("permissions", permissions)
                .claim("name", user.getName())
                .claim("gender", user.getGender())
                .claim("phoneNumber", user.getPhoneNumber())
                .claim("dateofbirth", user.getDateOfBirth().toString())
                .claim("createda.te", user.getCreatedDate().toString())
                .claim("createdate", user.getCreatedDate().toString())
                .claim("profileImage", user.getProfileImage())
                .claim("orderCount", user.getOrderCount())
                .claim("vipTier", vipTierName) // <-- Add this line
                .claim("roleLevel", user.getRole().getLevel())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(secretKey, SignatureAlgorithm.HS512)
                .compact();
    }

    public String getEmailFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.getSubject();
    }

    public String getRolesFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.get("roles", String.class);
    }



    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.error("JWT token is malformed: {}", e.getMessage());
        } catch (SignatureException e) {
            logger.error("JWT signature validation failed: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT token is invalid: {}", e.getMessage());
        }
        return false;
    }

    // Helper method to parse claims with unified exception handling
    public Claims parseClaims(String token) { //change private to pubile
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
