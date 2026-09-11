package com.Ojt.Ecommerce.security;

public interface TokenBlacklistStore {

    void blacklist(String token, long ttlSeconds);

    boolean isBlacklisted(String token);
}
