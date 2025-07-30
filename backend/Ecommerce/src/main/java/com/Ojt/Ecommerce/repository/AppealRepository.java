package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Appeal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppealRepository extends JpaRepository<Appeal, String> {

    // Find all pending appeals
    List<Appeal> findByStatusOrderBySubmittedAtDesc(Appeal.AppealStatus status);

    // Find appeals by user email
    List<Appeal> findByUserEmailOrderBySubmittedAtDesc(String userEmail);

    // Find appeals by blacklist entry ID
    List<Appeal> findByBlacklistEntryIdOrderBySubmittedAtDesc(String blacklistEntryId);

    // Count pending appeals
    long countByStatus(Appeal.AppealStatus status);

    // Find appeals submitted in the last 24 hours
    @Query("SELECT a FROM Appeal a WHERE a.submittedAt >= :since ORDER BY a.submittedAt DESC")
    List<Appeal> findRecentAppeals(@Param("since") java.time.LocalDateTime since);
    
    // Find appeals by multiple statuses
    List<Appeal> findByStatusIn(List<Appeal.AppealStatus> statuses);
}