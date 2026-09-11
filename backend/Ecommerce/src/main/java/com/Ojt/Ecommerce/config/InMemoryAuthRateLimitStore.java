package com.Ojt.Ecommerce.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "false", matchIfMissing = true)
public class InMemoryAuthRateLimitStore implements AuthRateLimitStore {

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Override
    public int incrementAndGet(String clientKey, long windowMs, int maxRequests) {
        long now = Instant.now().toEpochMilli();
        WindowCounter counter = counters.compute(clientKey, (key, existing) -> {
            if (existing == null || now - existing.windowStartMs >= windowMs) {
                return new WindowCounter(now, new AtomicInteger(0));
            }
            return existing;
        });
        int count = counter.count.incrementAndGet();
        return count > maxRequests ? -1 : count;
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
