package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.PermissionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionCategoryRepository extends JpaRepository<PermissionCategory, Long> {
    Optional<PermissionCategory> findByKey(String key);
    List<PermissionCategory> findAll();


}
