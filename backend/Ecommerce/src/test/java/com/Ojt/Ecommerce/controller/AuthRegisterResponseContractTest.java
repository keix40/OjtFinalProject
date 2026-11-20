package com.Ojt.Ecommerce.controller;

import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.lang.reflect.Method;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Documents register handler contract: message-only JSON (tokens via HttpOnly cookies on login).
 */
class AuthRegisterResponseContractTest {

    @Test
    void registerEndpoint_isMultipartPostUnderAuthBase() throws Exception {
        RequestMapping classMapping = AuthController.class.getAnnotation(RequestMapping.class);
        assertNotNull(classMapping);
        assertEquals("/api/auth", classMapping.value()[0]);

        Method register =
                Arrays.stream(AuthController.class.getDeclaredMethods())
                        .filter(m -> "register".equals(m.getName()))
                        .findFirst()
                        .orElseThrow();
        PostMapping post = register.getAnnotation(PostMapping.class);
        assertNotNull(post);
        assertEquals("/register", post.value()[0]);
    }
}