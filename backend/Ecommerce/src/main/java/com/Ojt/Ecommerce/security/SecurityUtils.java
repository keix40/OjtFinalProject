package com.Ojt.Ecommerce.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public final class SecurityUtils {

    private static final Set<String> ADMIN_VIEW_PERMISSIONS = Set.of(
            "users.view",
            "orders.view",
            "customers.view"
    );

    private SecurityUtils() {
    }

    public static Optional<Long> getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return Optional.empty();
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            return Optional.of(customUserDetails.getUser().getId());
        }
        return Optional.empty();
    }

    public static Long requireCurrentUserId() {
        return getCurrentUserId().orElseThrow(() -> new AccessDeniedException("Authentication required"));
    }

    public static boolean hasAuthority(String authority) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals(authority));
    }

    public static boolean hasAnyAdminViewPermission() {
        return ADMIN_VIEW_PERMISSIONS.stream().anyMatch(SecurityUtils::hasAuthority);
    }

    public static void enforceSelfOrAdmin(Long requestedUserId) {
        Long currentUserId = requireCurrentUserId();
        if (currentUserId.equals(requestedUserId)) {
            return;
        }
        if (hasAnyAdminViewPermission()) {
            return;
        }
        throw new AccessDeniedException("Access denied for user " + requestedUserId);
    }

    public static Set<String> getCurrentAuthorities() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return Set.of();
        }
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
    }
}
