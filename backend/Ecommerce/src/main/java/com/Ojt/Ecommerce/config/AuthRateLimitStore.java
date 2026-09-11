package com.Ojt.Ecommerce.config;

public interface AuthRateLimitStore {

    /** @return current count in window, or -1 if over limit */
    int incrementAndGet(String clientKey, long windowMs, int maxRequests);
}
