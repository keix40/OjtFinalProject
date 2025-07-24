package com.Ojt.Ecommerce.service;

import org.springframework.stereotype.Service;

@Service
public class AuthService {
    // TODO: Replace with real user context/permission logic
    public boolean currentUserHasPermission(String permissionKey) {
        // Example: always allow for now
        return true;
    }
} 