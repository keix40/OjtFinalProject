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

    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.email = :email")
    Optional<User> findByEmailWithRole(@Param("email") String email);
    
    Optional<User> findByPhoneNumber(String phoneNumber);

    // New Users methods for dashboard
    int countByCreatedDateBetweenAndRole_Name(java.time.LocalDateTime start, java.time.LocalDateTime end, String roleName);
    
    // VIP customer count methods using native queries to match database exactly
    @Query(value = "SELECT COUNT(*) FROM users u " +
                   "JOIN role r ON u.role_id = r.id " +
                   "WHERE r.name = 'CUSTOMER' " +
                   "AND u.total_points >= 10000 " +
                   "AND u.created_date <= LAST_DAY(:endDate)", nativeQuery = true)
    int countVipCustomersAtEndOfMonth(@Param("endDate") String endDate);
}
