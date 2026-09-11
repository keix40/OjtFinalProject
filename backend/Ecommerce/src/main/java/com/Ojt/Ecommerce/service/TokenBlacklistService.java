package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.security.JwtTokenProvider;
import com.Ojt.Ecommerce.security.TokenBlacklistStore;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final TokenBlacklistStore store;
    private final JwtTokenProvider jwtTokenProvider;

    public void blacklistToken(String token) {
        store.blacklist(token, remainingTtlSeconds(token));
    }

    public boolean isTokenBlacklisted(String token) {
        return store.isBlacklisted(token);
    }

    private long remainingTtlSeconds(String token) {
        try {
            Claims claims = jwtTokenProvider.parseClaims(token);
            if (claims.getExpiration() != null) {
                long ms = claims.getExpiration().getTime() - System.currentTimeMillis();
                return Math.max(ms / 1000L, 60L);
            }
        } catch (ExpiredJwtException e) {
            return 60L;
        } catch (Exception ignored) {
            // fall through
        }
        return 86_400L;
    }
}
