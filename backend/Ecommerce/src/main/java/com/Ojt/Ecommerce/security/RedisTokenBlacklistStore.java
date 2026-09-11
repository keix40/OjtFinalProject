package com.Ojt.Ecommerce.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;

@Component
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "true")
public class RedisTokenBlacklistStore implements TokenBlacklistStore {

    private static final Logger log = LoggerFactory.getLogger(RedisTokenBlacklistStore.class);
    private static final String KEY_PREFIX = "jwt:blacklist:";

    private final StringRedisTemplate redisTemplate;

    public RedisTokenBlacklistStore(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void blacklist(String token, long ttlSeconds) {
        try {
            long ttl = ttlSeconds > 0 ? ttlSeconds : 86_400L;
            redisTemplate.opsForValue().set(KEY_PREFIX + hash(token), "1", Duration.ofSeconds(ttl));
        } catch (Exception e) {
            log.warn("Redis blacklist write failed, token may remain valid until expiry: {}", e.getMessage());
        }
    }

    @Override
    public boolean isBlacklisted(String token) {
        try {
            Boolean exists = redisTemplate.hasKey(KEY_PREFIX + hash(token));
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.error("Redis blacklist read failed — failing closed (token treated as blacklisted): {}", e.getMessage());
            return true;
        }
    }

    private static String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
