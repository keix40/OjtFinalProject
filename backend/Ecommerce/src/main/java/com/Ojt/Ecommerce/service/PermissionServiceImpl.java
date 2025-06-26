package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.PermissionDTO;
import com.Ojt.Ecommerce.entity.Permission;
import com.Ojt.Ecommerce.repository.PermissionRepository;
import com.Ojt.Ecommerce.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PermissionServiceImpl implements PermissionService {

    @Autowired
    private PermissionRepository permissionRepository;

    @Override
    public Permission createPermission(Permission permission) {
        return permissionRepository.save(permission);
    }

    @Override
    public List<PermissionDTO> getAllPermissions() {
        List<Permission> permissions = permissionRepository.findAll();
        return permissions.stream()
                .map(p -> new PermissionDTO(
                        p.getId(),
                        p.getKey(),
                        p.getName(),
                        p.getDescription(),
                        p.getLevel(),
                        p.getPermissionCategory() != null ? p.getPermissionCategory().getId() : null
                ))
                .collect(Collectors.toList());
    }


    @Override
    public void deletePermission(Long id) {
        permissionRepository.deleteById(id);
    }
}
