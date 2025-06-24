package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Permission;

import java.util.List;

public interface PermissionService {
    Permission createPermission(Permission permission);
    List<Permission> getAllPermissions();
    void deletePermission(Long id);
}
