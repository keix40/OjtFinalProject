package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.annotations.RequiresPermission;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.GetMapping;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import static com.Ojt.Ecommerce.constants.PermissionConstants.SECURITY_VIEW_ATTEMPTS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LoginAttemptPermissionTest {

    private static final Set<String> PUBLIC_GET_METHODS = Set.of("isBlocked");

    @Test
    void allLoginAttemptReadEndpointsRequireSecurityViewAttempts() {
        Method[] methods = LoginAttemptController.class.getDeclaredMethods();
        long protectedReads = Arrays.stream(methods)
                .filter(m -> m.isAnnotationPresent(GetMapping.class))
                .filter(m -> !PUBLIC_GET_METHODS.contains(m.getName()))
                .peek(m -> assertTrue(m.isAnnotationPresent(RequiresPermission.class),
                        () -> "Missing @RequiresPermission on " + m.getName()))
                .peek(m -> {
                    RequiresPermission perm = m.getAnnotation(RequiresPermission.class);
                    assertEquals(SECURITY_VIEW_ATTEMPTS, perm.value(),
                            () -> "Wrong permission on " + m.getName());
                })
                .count();
        assertTrue(protectedReads >= 8, "Expected all read sub-routes to be permission-gated");
    }

    @Test
    void isBlockedRemainsPublic() {
        Method isBlocked = Arrays.stream(LoginAttemptController.class.getDeclaredMethods())
                .filter(m -> m.getName().equals("isBlocked"))
                .findFirst()
                .orElseThrow();
        assertNotNull(isBlocked.getAnnotation(GetMapping.class));
    }
}
