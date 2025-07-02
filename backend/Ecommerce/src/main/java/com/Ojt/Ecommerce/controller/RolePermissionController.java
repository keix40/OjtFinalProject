package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.service.RolePermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/role-permissions")
@CrossOrigin(origins = "http://localhost:4200")
public class RolePermissionController {

    @Autowired
    private RolePermissionService rolePermissionService;

    @PostMapping("/assign")
    public void assignPermissionsToRole(
            @RequestParam Long roleId,
            @RequestBody List<Long> permissionIds
    ) {
        rolePermissionService.assignPermissionsToRole(roleId, permissionIds);
    }
}
