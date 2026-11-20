package com.Ojt.Ecommerce.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regression: assign-role must accept cookie session (JwtAuthenticationFilter), not a required
 * Authorization header on the handler signature.
 */
class UserAssignRoleCookieContractTest {

    @Test
    void assignRoleToUser_doesNotRequireAuthorizationHeader() throws Exception {
        Method method =
                UserController.class.getMethod(
                        "assignRoleToUser", Long.class, Long.class, HttpServletResponse.class);
        boolean requiresAuthHeader =
                Arrays.stream(method.getParameters())
                        .anyMatch(UserAssignRoleCookieContractTest::isAuthorizationHeader);
        assertFalse(requiresAuthHeader, "assign-role must not require Authorization header");
    }

    @Test
    void assignRoleToUser_declaresPutMappingOnAssignRolePath() throws Exception {
        Method method =
                UserController.class.getMethod(
                        "assignRoleToUser", Long.class, Long.class, HttpServletResponse.class);
        PutMapping mapping = method.getAnnotation(PutMapping.class);
        assertNotNull(mapping);
        assertTrue(
                Arrays.stream(mapping.value()).anyMatch(v -> v.contains("assign-role")),
                "expected assign-role route");
    }

    private static boolean isAuthorizationHeader(Parameter parameter) {
        RequestHeader header = parameter.getAnnotation(RequestHeader.class);
        if (header == null) {
            return false;
        }
        String name = header.value().isEmpty() ? header.name() : header.value();
        return "Authorization".equalsIgnoreCase(name);
    }
}