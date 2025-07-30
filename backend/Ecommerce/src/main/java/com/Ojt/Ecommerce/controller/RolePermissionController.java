package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;
import com.Ojt.Ecommerce.annotations.RequiresPermission;
import com.Ojt.Ecommerce.service.RolePermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import static com.Ojt.Ecommerce.constants.PermissionConstants.*;

@RestController
@RequestMapping("/api/role-permissions")
@CrossOrigin(origins = "http://localhost:4200")
@PermissionCategoryTag(value = "roles", name = "Role Management", icon = "fa-user-tag")
public class RolePermissionController {

    @Autowired
    private RolePermissionService rolePermissionService;

    @PostMapping("/assign")
    @RequiresPermission(value = ROLES_ASSIGN_PERMISSIONS, level = "advanced", description = "Assign permissions to roles")
    public void assignPermissionsToRole(
            @RequestParam Long roleId,
            @RequestBody List<Long> permissionIds
    ) {
        rolePermissionService.assignPermissionsToRole(roleId, permissionIds);
    }
}
