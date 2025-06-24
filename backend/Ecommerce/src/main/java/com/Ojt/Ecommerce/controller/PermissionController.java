package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.entity.Permission;
import com.Ojt.Ecommerce.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
@CrossOrigin(origins = "http://localhost:4200")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;

    @PostMapping
    public Permission createPermission(@RequestBody Permission permission) {
        return permissionService.createPermission(permission);
    }

    @GetMapping
    public List<Permission> getAllPermissions() {
        return permissionService.getAllPermissions();
    }

    @DeleteMapping("/{id}")
    public void deletePermission(@PathVariable Long id) {
        permissionService.deletePermission(id);
    }
}
