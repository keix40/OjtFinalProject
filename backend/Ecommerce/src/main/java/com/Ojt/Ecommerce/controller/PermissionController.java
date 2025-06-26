package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.PermissionDTO;
import com.Ojt.Ecommerce.entity.Permission;
import com.Ojt.Ecommerce.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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


    @DeleteMapping("/{id}")
    public void deletePermission(@PathVariable Long id) {
        permissionService.deletePermission(id);
    }
}
