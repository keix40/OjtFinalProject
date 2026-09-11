package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.security.SecurityUtils;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    public boolean currentUserHasPermission(String permissionKey) {
        if (permissionKey == null || permissionKey.isBlank()) {
            return false;
        }
        return SecurityUtils.hasAuthority(permissionKey);
    }
}
