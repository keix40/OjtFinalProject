package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.repository.RoleRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.security.AuthCookieService;
import com.Ojt.Ecommerce.security.CustomUserDetails;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import com.Ojt.Ecommerce.security.SecurityUtils;
import com.Ojt.Ecommerce.service.AddressService;
import com.Ojt.Ecommerce.service.UserService;
import org.springframework.test.util.ReflectionTestUtils;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Assign-role uses SecurityContext + cookies, not a required Authorization header. */
@ExtendWith(MockitoExtension.class)
class AssignRoleHandlerBehaviorTest {

    @Mock private UserService userService;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private UserRepository userRepository;
    @Mock private AuthCookieService authCookieService;

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void assignRoleToUser_selfAssign_refreshesAuthCookie() {
        UserController controller =
                new UserController(
                        userService,
                        jwtTokenProvider,
                        userRepository,
                        new ModelMapper(),
                        mock(PasswordEncoder.class),
                        mock(AddressService.class),
                        mock(RoleRepository.class));
        ReflectionTestUtils.setField(controller, "authCookieService", authCookieService);

        User actor = new User();
        actor.setId(9L);
        actor.setEmail("admin@test.com");
        Role role = new Role();
        role.setName("ADMIN");
        actor.setRole(role);

        User updated = new User();
        updated.setId(9L);
        updated.setEmail("admin@test.com");
        updated.setRole(role);

        CustomUserDetails details = new CustomUserDetails(actor);
        SecurityContextHolder.getContext()
                .setAuthentication(
                        new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities()));

        when(userRepository.findById(9L)).thenReturn(Optional.of(updated));
        when(jwtTokenProvider.generateToken(updated)).thenReturn("jwt-token");

        HttpServletResponse response = mock(HttpServletResponse.class);
        ResponseEntity<Map<String, Object>> result = controller.assignRoleToUser(9L, 2L, response);

        assertEquals(200, result.getStatusCode().value());
        assertTrue((Boolean) result.getBody().get("userAffected"));
        verify(userService).assignRoleToUser(9L, 2L);
        verify(authCookieService).setAuthCookies(eq(response), eq("jwt-token"), eq(null));
        SecurityUtils.getCurrentUserId().ifPresent(id -> assertEquals(9L, id));
    }
}