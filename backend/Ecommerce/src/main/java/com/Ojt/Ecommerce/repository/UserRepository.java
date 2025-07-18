package com.Ojt.Ecommerce.repository;


import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.dto.CustomerSummaryDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRoleId(Long roleId);


    Optional<User> findByName(String username);

    List<User> findByRole_Name(String roleName);
    List<User> findByRole_NameNot(String roleName);

    @Query("SELECT u FROM User u WHERE LOWER(u.role.name) <> LOWER(:roleName)")
    List<User> findByRoleNameNotIgnoreCase(@Param("roleName") String roleName);
}
