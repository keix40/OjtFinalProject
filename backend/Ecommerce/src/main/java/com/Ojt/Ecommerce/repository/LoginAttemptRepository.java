package com.Ojt.Ecommerce.repository;


import com.Ojt.Ecommerce.entity.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    int countByIpAddressAndTimestampAfter(String ipAddress, LocalDateTime after);

    List<LoginAttempt> findTop10ByIpAddressOrderByTimestampDesc(String ipAddress);

    // 🔍 Find all usernames that used the most frequently used IP of a specific username
    @Query("SELECT DISTINCT la2.username FROM LoginAttempt la1, LoginAttempt la2 " +
           "WHERE la1.username = :username " +
           "AND la1.ipAddress = (" +
           "  SELECT la3.ipAddress FROM LoginAttempt la3 " +
           "  WHERE la3.username = :username " +
           "  GROUP BY la3.ipAddress " +
           "  ORDER BY COUNT(*) DESC " +
           "  LIMIT 1" +
           ") " +
           "AND la1.ipAddress = la2.ipAddress " +
           "AND la2.username != :username")
    List<String> findRelatedUsernames(@Param("username") String username);

}
