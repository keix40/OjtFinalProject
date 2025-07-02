package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Role;
import java.util.List;

public interface RoleService {
    Role createRole(Role role);
    Role updateRole(Long id, Role role);
    void deleteRole(Long id);
    Role getRoleById(Long id);
    List<Role> getAllRoles();
}
