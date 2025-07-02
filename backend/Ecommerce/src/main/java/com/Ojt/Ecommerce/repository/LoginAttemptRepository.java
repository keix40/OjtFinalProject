package com.Ojt.Ecommerce.repository;


import com.Ojt.Ecommerce.entity.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    // 🔍 Find attempts within a time range
    List<LoginAttempt> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    // 🔍 Filter by status (successful, failed, etc.)
    List<LoginAttempt> findByStatus(String status);

    // 🔍 Search by username, IP, or location (for search box)
    List<LoginAttempt> findByUsernameContainingIgnoreCaseOrIpAddressContainingIgnoreCaseOrLocationContainingIgnoreCase(
            String username, String ipAddress, String location
    );

    // 🔍 Filter by threatLevel
    List<LoginAttempt> findByThreatLevel(String threatLevel);

    // 🔍 All combined filter logic will be done in service layer later
}
