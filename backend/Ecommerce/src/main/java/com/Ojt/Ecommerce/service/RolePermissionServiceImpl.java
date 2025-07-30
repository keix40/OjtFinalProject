package com.Ojt.Ecommerce.service;


import com.Ojt.Ecommerce.entity.Permission;
import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.entity.RolePermission;
import com.Ojt.Ecommerce.entity.RolePermissionLog;
import com.Ojt.Ecommerce.repository.PermissionRepository;
import com.Ojt.Ecommerce.repository.RolePermissionLogRepository;
import com.Ojt.Ecommerce.repository.RolePermissionRepository;
import com.Ojt.Ecommerce.repository.RoleRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RolePermissionServiceImpl implements RolePermissionService {

    @Autowired
    private RolePermissionRepository rolePermissionRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private RolePermissionLogRepository logRepository;

    @Override
    @Transactional
    public void assignPermissionsToRole(Long roleId, List<Long> permissionIds) {
        Role role = roleRepository.findById(roleId).orElseThrow();

        // Get current permission IDs for the role
        List<Long> currentPermissionIds = rolePermissionRepository.findByRoleId(roleId)
            .stream()
            .map(rp -> rp.getPermission().getId())
            .collect(Collectors.toList());

        // Debug logging
        System.out.println("[RolePermission] Current permission IDs: " + currentPermissionIds);
        System.out.println("[RolePermission] New permission IDs: " + permissionIds);

        // Find permissions to add and remove
        Set<Long> toAdd = new HashSet<>(permissionIds);
        toAdd.removeAll(currentPermissionIds);

        Set<Long> toRemove = new HashSet<>(currentPermissionIds);
        toRemove.removeAll(permissionIds);

        System.out.println("[RolePermission] To add: " + toAdd);
        System.out.println("[RolePermission] To remove: " + toRemove);

        // Remove permissions
        for (Long pid : toRemove) {
            System.out.println("[RolePermission] Removing permission " + pid + " from role " + roleId);
            rolePermissionRepository.deleteByRoleAndPermission(roleId, pid);
        }

        // Add new permissions
        for (Long pid : toAdd) {
            Permission permission = permissionRepository.findById(pid).orElseThrow();
            RolePermission rp = RolePermission.builder()
                    .role(role)
                    .permission(permission)
                    .build();
            rolePermissionRepository.save(rp);
            System.out.println("[RolePermission] Added permission " + pid + " to role " + roleId);
        }

        // Log the assignment
        RolePermissionLog log = new RolePermissionLog();
        log.setAction("ASSIGNED");
        log.setTargetType("ROLE");
        log.setTargetId(roleId);
        log.setTargetName(role.getName());
        log.setPerformedBy("system"); // TODO: Replace with real user
        log.setTimestamp(LocalDateTime.now());
        log.setDetails("Assigned permissions: " + permissionIds);
        logRepository.save(log);
    }
}
