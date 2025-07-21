package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    
    // Find by user ID
    Page<ActivityLog> findByUserIdOrderByTimestampDesc(Long userId, Pageable pageable);
    
    // Find by action type
    Page<ActivityLog> findByActionTypeOrderByTimestampDesc(String actionType, Pageable pageable);
    
    // Find by entity type
    Page<ActivityLog> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);
    
    // Find by severity level
    Page<ActivityLog> findBySeverityLevelOrderByTimestampDesc(String severityLevel, Pageable pageable);
    
    // Find by timestamp range
    Page<ActivityLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end, Pageable pageable);
    
    // Find by IP address
    Page<ActivityLog> findByIpAddressContainingOrderByTimestampDesc(String ipAddress, Pageable pageable);
    
    // Find by description containing text
    Page<ActivityLog> findByDescriptionContainingIgnoreCaseOrderByTimestampDesc(String description, Pageable pageable);
    
    // Find by user role
    Page<ActivityLog> findByUserRoleOrderByTimestampDesc(String userRole, Pageable pageable);
    
    // Find by status
    Page<ActivityLog> findByStatusOrderByTimestampDesc(String status, Pageable pageable);
    
    // Complex search query
    @Query("SELECT al FROM ActivityLog al WHERE " +
           "(:userId IS NULL OR al.userId = :userId) AND " +
           "(:actionType IS NULL OR al.actionType = :actionType) AND " +
           "(:entityType IS NULL OR al.entityType = :entityType) AND " +
           "(:severityLevel IS NULL OR al.severityLevel = :severityLevel) AND " +
           "(:ipAddress IS NULL OR al.ipAddress LIKE %:ipAddress%) AND " +
           "(:searchTerm IS NULL OR al.description LIKE %:searchTerm%) AND " +
           "(:startDate IS NULL OR al.timestamp >= :startDate) AND " +
           "(:endDate IS NULL OR al.timestamp <= :endDate) " +
           "ORDER BY al.timestamp DESC")
    Page<ActivityLog> findWithFilters(
            @Param("userId") Long userId,
            @Param("actionType") String actionType,
            @Param("entityType") String entityType,
            @Param("severityLevel") String severityLevel,
            @Param("ipAddress") String ipAddress,
            @Param("searchTerm") String searchTerm,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
    
    // Count by action type
    @Query("SELECT al.actionType, COUNT(al) FROM ActivityLog al GROUP BY al.actionType")
    List<Object[]> countByActionType();
    
    // Count by severity level
    @Query("SELECT al.severityLevel, COUNT(al) FROM ActivityLog al GROUP BY al.severityLevel")
    List<Object[]> countBySeverityLevel();
    
    // Count by entity type
    @Query("SELECT al.entityType, COUNT(al) FROM ActivityLog al GROUP BY al.entityType")
    List<Object[]> countByEntityType();
    
    // Count by user role
    @Query("SELECT al.userRole, COUNT(al) FROM ActivityLog al GROUP BY al.userRole")
    List<Object[]> countByUserRole();
    
    // Get recent activity for dashboard
    @Query("SELECT al FROM ActivityLog al ORDER BY al.timestamp DESC")
    Page<ActivityLog> findRecentActivity(Pageable pageable);
    
    // Get critical activities
    @Query("SELECT al FROM ActivityLog al WHERE al.severityLevel = 'CRITICAL' ORDER BY al.timestamp DESC")
    Page<ActivityLog> findCriticalActivities(Pageable pageable);
    
    // Get activities by user and time range
    @Query("SELECT al FROM ActivityLog al WHERE al.userId = :userId AND al.timestamp BETWEEN :startDate AND :endDate ORDER BY al.timestamp DESC")
    List<ActivityLog> findByUserIdAndTimeRange(@Param("userId") Long userId, 
                                             @Param("startDate") LocalDateTime startDate, 
                                             @Param("endDate") LocalDateTime endDate);
    
    // Get unique users who performed activities
    @Query("SELECT DISTINCT al.userId, al.userName, al.userRole FROM ActivityLog al")
    List<Object[]> findUniqueUsers();
    
    // Get activity statistics
    @Query("SELECT COUNT(al), COUNT(DISTINCT al.userId), COUNT(CASE WHEN al.severityLevel = 'CRITICAL' THEN 1 END) FROM ActivityLog al")
    Object[] getActivityStatistics();
} 