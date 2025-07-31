package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.PermissionDTO;
import com.Ojt.Ecommerce.entity.Permission;
import com.Ojt.Ecommerce.service.PermissionService;
import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;
import com.Ojt.Ecommerce.annotations.RequiresPermission;
import com.Ojt.Ecommerce.annotations.LogActivity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import static com.Ojt.Ecommerce.constants.PermissionConstants.*;

@RestController
@RequestMapping("/api/permissions")
@CrossOrigin(origins = "http://localhost:4200")
@PermissionCategoryTag(value = "permissions", name = "Permission Management", icon = "fa-key")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private com.Ojt.Ecommerce.repository.PermissionRepository permissionRepository;

    @LogActivity(actionType = "CREATE", entityType = "PERMISSION", description = "Created permission", severityLevel = "MEDIUM")
    @PostMapping
    @RequiresPermission(value = PERMISSIONS_CREATE, level = "critical", description = "Create new permission")
    public Permission createPermission(@RequestBody Permission permission) {
        return permissionService.createPermission(permission);
    }

    @GetMapping
    @RequiresPermission(value = PERMISSIONS_VIEW, level = "basic", description = "View all permissions")
    public ResponseEntity<?> getAllPermissions() {
        try {
            List<PermissionDTO> permissionDTOs = permissionService.getAllPermissions();
            return ResponseEntity.ok(permissionDTOs);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Failed to load permissions: " + e.getMessage());
            error.put("status", 500);
            error.put("timestamp", LocalDateTime.now().toString());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }


    @LogActivity(actionType = "DELETE", entityType = "PERMISSION", description = "Deleted permission", severityLevel = "HIGH", entityIdParam = "id")
    @DeleteMapping("/{id}")
    @RequiresPermission(value = PERMISSIONS_DELETE, level = "critical", description = "Delete permission")
    public void deletePermission(@PathVariable Long id) {
        permissionService.deletePermission(id);
    }
}
