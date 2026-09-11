package com.Ojt.Ecommerce.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "true")
public class RedisAuthRateLimitStore implements AuthRateLimitStore {

    private static final Logger log = LoggerFactory.getLogger(RedisAuthRateLimitStore.class);
    private static final String KEY_PREFIX = "auth:rate:";

    private final StringRedisTemplate redisTemplate;

    public RedisAuthRateLimitStore(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public int incrementAndGet(String clientKey, long windowMs, int maxRequests) {
        try {
            String key = KEY_PREFIX + clientKey;
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redisTemplate.expire(key, Duration.ofMillis(windowMs));
            }
            if (count != null && count > maxRequests) {
                return -1;
            }
            return count != null ? count.intValue() : 1;
        } catch (Exception e) {
            log.error("Redis rate-limit failed — failing closed (request blocked): {}", e.getMessage());
            return -1;
        }
    }
}
