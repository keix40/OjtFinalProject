package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.PermissionDTO;
import com.Ojt.Ecommerce.dto.RoleDTO;
import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "http://localhost:4200")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @PostMapping
    public Role createRole(@RequestBody Role role) {
        return roleService.createRole(role);
    }

    @PutMapping("/{id}")
    public Role updateRole(@PathVariable Long id, @RequestBody Role role) {
        return roleService.updateRole(id, role);
    }

    @DeleteMapping("/{id}")
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
