package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    List<RolePermission> findByRoleId(Long roleId);
    @Modifying
    @Query("DELETE FROM RolePermission rp WHERE rp.role.id = :roleId AND rp.permission.id = :permissionId")
    void deleteByRoleAndPermission(@Param("roleId") Long roleId, @Param("permissionId") Long permissionId);
}
