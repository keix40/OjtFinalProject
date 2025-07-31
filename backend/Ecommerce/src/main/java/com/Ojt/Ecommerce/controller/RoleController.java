package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.PermissionDTO;
import com.Ojt.Ecommerce.dto.RoleDTO;
import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import com.Ojt.Ecommerce.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;
import com.Ojt.Ecommerce.annotations.RequiresPermission;
import com.Ojt.Ecommerce.annotations.LogActivity;
import static com.Ojt.Ecommerce.constants.PermissionConstants.*;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "http://localhost:4200")
@PermissionCategoryTag(value = "roles", name = "Role Management", icon = "fa-user-tag")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.Ojt.Ecommerce.repository.RoleRepository roleRepository;

    @LogActivity(actionType = "CREATE", entityType = "ROLE", description = "Created role", severityLevel = "MEDIUM")
    @PostMapping
    @RequiresPermission(value = ROLES_CREATE, level = "advanced", description = "Create a new role")
    public Role createRole(@RequestBody Role role) {
        return roleService.createRole(role);
    }

    @LogActivity(actionType = "UPDATE", entityType = "ROLE", description = "Updated role", severityLevel = "MEDIUM", entityIdParam = "id", logChanges = true)
    @PutMapping("/{id}")
    @RequiresPermission(value = ROLES_UPDATE, level = "advanced", description = "Update an existing role")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody Role role, @RequestHeader("Authorization") String token) {
        // Get acting user from token
        String actingUserEmail = jwtTokenProvider.getEmailFromToken(token.replace("Bearer ", ""));
        var actingUser = userRepository.findByEmail(actingUserEmail).orElseThrow();
        Role targetRole = roleService.getRoleById(id);
        if (actingUser.getRole().getLevel() <= targetRole.getLevel()) {
            return ResponseEntity.status(403).body("You cannot edit a role with equal or higher level.");
        }
        Role updated = roleService.updateRole(id, role);
        return ResponseEntity.ok(updated);
    }

    @LogActivity(actionType = "DELETE", entityType = "ROLE", description = "Deleted role", severityLevel = "HIGH", entityIdParam = "id")
    @DeleteMapping("/{id}")
    @RequiresPermission(value = ROLES_DELETE, level = "critical", description = "Delete a role")
    public void deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
    }

    @GetMapping("/{id}")
    public Role getRoleById(@PathVariable Long id) {
        return roleService.getRoleById(id);
    }


    //got error so fix
    @GetMapping
    public List<RoleDTO> getAllRoles() {
        List<Role> roles = roleService.getAllRoles();

        List<RoleDTO> dtos = roles.stream().map(role -> {
            RoleDTO dto = new RoleDTO();
            dto.setId(role.getId());
            dto.setName(role.getName());
            dto.setLevel(role.getLevel());

            List<PermissionDTO> permissionDTOs = role.getRolePermissions().stream()
                    .map(rp -> {
                        var permission = rp.getPermission();
                        PermissionDTO pDto = new PermissionDTO();
                        pDto.setId(permission.getId());
                        pDto.setKey(permission.getKey());
                        pDto.setName(permission.getName());
                        pDto.setDescription(permission.getDescription());
                        pDto.setLevel(permission.getLevel());
                        pDto.setCategoryId(permission.getPermissionCategory().getId());
                        return pDto;
                    }).toList();

            dto.setPermissions(permissionDTOs);

            return dto;
        }).toList();

        return dtos;
    }
}
