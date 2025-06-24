package com.Ojt.Ecommerce.service;

import java.util.List;

public interface RolePermissionService {
    void assignPermissionsToRole(Long roleId, List<Long> permissionIds);
}
