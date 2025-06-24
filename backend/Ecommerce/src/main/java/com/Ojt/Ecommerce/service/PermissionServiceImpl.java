package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Permission;
import com.Ojt.Ecommerce.repository.PermissionRepository;
import com.Ojt.Ecommerce.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PermissionServiceImpl implements PermissionService {

    @Autowired
    private PermissionRepository permissionRepository;

    @Override
    public Permission createPermission(Permission permission) {
        return permissionRepository.save(permission);
    }

    @Override
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    @Override
    public void deletePermission(Long id) {
        permissionRepository.deleteById(id);
    }
}
