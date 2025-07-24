package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.RolePermissionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RolePermissionLogRepository extends JpaRepository<RolePermissionLog, Long> {
}
