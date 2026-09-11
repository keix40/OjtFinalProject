package com.Ojt.Ecommerce.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AuthServicePermissionTest {

    private final AuthService authService = new AuthService();

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void currentUserHasPermission_returnsTrueWhenAuthorityPresent() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "user@test.com",
                        null,
                        List.of(new SimpleGrantedAuthority("orders.create"))
                )
        );
        assertTrue(authService.currentUserHasPermission("orders.create"));
    }

    @Test
    void currentUserHasPermission_returnsFalseWhenMissing() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user@test.com", null, List.of())
        );
        assertFalse(authService.currentUserHasPermission("orders.create"));
    }
}
