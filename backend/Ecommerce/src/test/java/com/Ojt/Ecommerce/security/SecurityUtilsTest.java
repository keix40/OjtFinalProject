package com.Ojt.Ecommerce.security;

import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SecurityUtilsTest {

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getCurrentUserId_returnsIdWhenPrincipalIsCustomUserDetails() {
        User user = new User();
        user.setId(42L);
        user.setEmail("user@test.com");
        Role role = new Role();
        role.setName("CUSTOMER");
        user.setRole(role);

        CustomUserDetails details = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities()));

        assertEquals(42L, SecurityUtils.getCurrentUserId().orElseThrow());
    }

    @Test
    void getCurrentUserId_emptyWhenNoAuthentication() {
        assertTrue(SecurityUtils.getCurrentUserId().isEmpty());
    }
}
