package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.BlacklistEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BlacklistRepository extends JpaRepository<BlacklistEntry, String> {
    List<BlacklistEntry> findByStatus(BlacklistEntry.Status status);
    
    List<BlacklistEntry> findByAddedDateAfter(LocalDateTime date);
    
    @Query("SELECT COUNT(b) FROM BlacklistEntry b WHERE b.status = 'ACTIVE'")
    long countActiveEntries();
    
    @Query("SELECT COUNT(b) FROM BlacklistEntry b WHERE b.addedDate >= ?1")
    long countEntriesAddedAfter(LocalDateTime date);
    
    @Query("SELECT SUM(b.incidentCount) FROM BlacklistEntry b")
    Integer getTotalIncidents();
    
    @Query("SELECT COUNT(b) FROM BlacklistEntry b WHERE b.status = 'APPEALED'")
    long countPendingAppeals();
    
    List<BlacklistEntry> findByTargetTypeAndTargetValue(BlacklistEntry.TargetType targetType, String targetValue);
    
    @Query("SELECT b FROM BlacklistEntry b WHERE " +
           "(:search IS NULL OR LOWER(b.targetValue) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(b.reason) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:category IS NULL OR b.category = :category) AND " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:riskLevel IS NULL OR b.riskLevel = :riskLevel)")
    List<BlacklistEntry> findWithFilters(String search, BlacklistEntry.Category category, 
                                       BlacklistEntry.Status status, BlacklistEntry.RiskLevel riskLevel);

    @Query("SELECT b FROM BlacklistEntry b WHERE b.targetType = :targetType AND b.targetValue = :targetValue AND b.status = 'ACTIVE' AND (b.expiryDate IS NULL OR b.expiryDate > CURRENT_TIMESTAMP)")
    BlacklistEntry findActiveByTargetTypeAndTargetValue(BlacklistEntry.TargetType targetType, String targetValue);
    
    @Query("SELECT b FROM BlacklistEntry b WHERE b.targetType = :targetType AND b.targetValue = :targetValue AND b.status = :status")
    BlacklistEntry findByTargetTypeAndTargetValueAndStatus(BlacklistEntry.TargetType targetType, String targetValue, BlacklistEntry.Status status);
    
    @Query("SELECT b FROM BlacklistEntry b WHERE b.status = 'ACTIVE' AND b.expiryDate IS NOT NULL AND b.expiryDate <= :date")
    List<BlacklistEntry> findActiveEntriesWithExpiryBefore(LocalDateTime date);
} 