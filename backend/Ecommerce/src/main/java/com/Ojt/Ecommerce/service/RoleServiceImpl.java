package com.Ojt.Ecommerce.service;


import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.repository.RoleRepository;
import com.Ojt.Ecommerce.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoleServiceImpl implements RoleService {

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public Role createRole(Role role) {
        return roleRepository.save(role);
    }

    @Override
    public Role updateRole(Long id, Role updatedRole) {
        Role role = roleRepository.findById(id).orElseThrow();
        role.setName(updatedRole.getName());
        return roleRepository.save(role);
    }

    @Override
    public void deleteRole(Long id) {
        roleRepository.deleteById(id);
    }

    @Override
    public Role getRoleById(Long id) {
        return roleRepository.findById(id).orElse(null);
    }

    @Override
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }
}
