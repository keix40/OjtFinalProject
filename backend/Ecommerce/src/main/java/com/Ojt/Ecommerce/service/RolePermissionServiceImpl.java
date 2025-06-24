package com.Ojt.Ecommerce.service;


import com.Ojt.Ecommerce.entity.Permission;
import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.entity.RolePermission;
import com.Ojt.Ecommerce.repository.PermissionRepository;
import com.Ojt.Ecommerce.repository.RolePermissionRepository;
import com.Ojt.Ecommerce.repository.RoleRepository;
import com.Ojt.Ecommerce.service.RolePermissionService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RolePermissionServiceImpl implements RolePermissionService {

    @Autowired
    private RolePermissionRepository rolePermissionRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Override
    @Transactional
    public void assignPermissionsToRole(Long roleId, List<Long> permissionIds) {
        Role role = roleRepository.findById(roleId).orElseThrow();
        // delete old
        rolePermissionRepository.deleteByRoleId(roleId);

        for (Long pid : permissionIds) {
            Permission permission = permissionRepository.findById(pid).orElseThrow();
            RolePermission rp = RolePermission.builder()
                    .role(role)
                    .permission(permission)
                    .build();
            rolePermissionRepository.save(rp);
        }
    }
}
