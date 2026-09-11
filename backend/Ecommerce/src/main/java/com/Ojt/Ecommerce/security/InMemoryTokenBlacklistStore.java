package com.Ojt.Ecommerce.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Component
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "false", matchIfMissing = true)
public class InMemoryTokenBlacklistStore implements TokenBlacklistStore {

    private final ConcurrentHashMap<String, Long> entries = new ConcurrentHashMap<>();

    @Override
    public void blacklist(String token, long ttlSeconds) {
        long ttl = ttlSeconds > 0 ? ttlSeconds : 86_400L;
        entries.put(token, Instant.now().toEpochMilli() + ttl * 1000L);
    }

    @Override
    public boolean isBlacklisted(String token) {
        Long expiresAt = entries.get(token);
        if (expiresAt == null) {
            return false;
        }
        if (Instant.now().toEpochMilli() > expiresAt) {
            entries.remove(token);
            return false;
        }
        return true;
    }
}
