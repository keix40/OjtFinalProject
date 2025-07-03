package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.PermissionDTO;
import com.Ojt.Ecommerce.entity.Permission;

import java.util.List;

public interface PermissionService {
    Permission createPermission(Permission permission);
    List<PermissionDTO> getAllPermissions();
    void deletePermission(Long id);
}
