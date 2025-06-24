package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
    boolean existsByName(String name);
}
