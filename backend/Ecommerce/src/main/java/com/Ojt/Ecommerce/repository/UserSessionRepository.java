package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    
    // Find active session by session ID
    Optional<UserSession> findBySessionIdAndEndTimeIsNull(String sessionId);
    
    // Find session by session ID (regardless of end time)
    Optional<UserSession> findBySessionId(String sessionId);
    
    // Delete session by session ID (for cleanup)
    void deleteBySessionId(String sessionId);
    
    // Find active sessions by user ID
    List<UserSession> findByUserIdAndEndTimeIsNull(Long userId);
    
    // Find sessions by user ID within time range
    List<UserSession> findByUserIdAndStartTimeBetween(Long userId, LocalDateTime start, LocalDateTime end);
    
    // Count active sessions within time range
    @Query(value = "SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE start_time BETWEEN :start AND :end AND end_time IS NULL", nativeQuery = true)
    int countActiveSessions(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Count total sessions within time range
    @Query(value = "SELECT COUNT(*) FROM user_sessions WHERE start_time BETWEEN :start AND :end", nativeQuery = true)
    int countTotalSessions(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Count bounce sessions within time range (sessions with page_count <= 1)
    @Query(value = "SELECT COUNT(*) FROM user_sessions WHERE start_time BETWEEN :start AND :end AND page_count <= 1", nativeQuery = true)
    int countBounceSessions(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Get sessions grouped by time period for trends
    @Query(value = "SELECT DATE(start_time) as date, COUNT(*) as totalSessions, " +
           "COUNT(CASE WHEN page_count <= 1 THEN 1 END) as bounceSessions, " +
           "COUNT(DISTINCT user_id) as uniqueUsers " +
           "FROM user_sessions " +
           "WHERE start_time BETWEEN :start AND :end " +
           "GROUP BY DATE(start_time) " +
           "ORDER BY date", nativeQuery = true)
    List<Object[]> getSessionStatsByDate(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Get sessions grouped by hour for hourly trends
    @Query(value = "SELECT DATE(start_time) as date, HOUR(start_time) as hour, " +
           "COUNT(*) as totalSessions, " +
           "COUNT(CASE WHEN page_count <= 1 THEN 1 END) as bounceSessions " +
           "FROM user_sessions " +
           "WHERE start_time BETWEEN :start AND :end " +
           "GROUP BY DATE(start_time), HOUR(start_time) " +
           "ORDER BY date, hour", nativeQuery = true)
    List<Object[]> getSessionStatsByHour(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Get sessions grouped by week for weekly trends
    @Query(value = "SELECT YEARWEEK(start_time) as week, " +
           "COUNT(*) as totalSessions, " +
           "COUNT(CASE WHEN page_count <= 1 THEN 1 END) as bounceSessions " +
           "FROM user_sessions " +
           "WHERE start_time BETWEEN :start AND :end " +
           "GROUP BY YEARWEEK(start_time) " +
           "ORDER BY week", nativeQuery = true)
    List<Object[]> getSessionStatsByWeek(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Get sessions grouped by month for monthly trends
    @Query(value = "SELECT YEAR(start_time) as year, MONTH(start_time) as month, " +
           "COUNT(*) as totalSessions, " +
           "COUNT(CASE WHEN page_count <= 1 THEN 1 END) as bounceSessions " +
           "FROM user_sessions " +
           "WHERE start_time BETWEEN :start AND :end " +
           "GROUP BY YEAR(start_time), MONTH(start_time) " +
           "ORDER BY year, month", nativeQuery = true)
    List<Object[]> getSessionStatsByMonth(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Clean up old sessions (for maintenance)
    @Query("DELETE FROM UserSession us WHERE us.startTime < :cutoffDate")
    void deleteOldSessions(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // Count total page views within time range
    @Query("SELECT SUM(us.pageCount) FROM UserSession us WHERE us.startTime BETWEEN :start AND :end")
    int countTotalPageViews(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Find sessions within time range
    @Query("SELECT us FROM UserSession us WHERE us.startTime BETWEEN :start AND :end")
    List<UserSession> findByStartTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Get engagement stats grouped by date
    @Query("SELECT DATE(us.startTime) as date, " +
           "SUM(us.pageCount) as totalPageViews, " +
           "COUNT(us) as totalSessions, " +
           "AVG(us.pageCount) as avgPageViews " +
           "FROM UserSession us " +
           "WHERE us.startTime BETWEEN :start AND :end " +
           "GROUP BY DATE(us.startTime) " +
           "ORDER BY date")
    List<Object[]> getEngagementStatsByDate(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Get engagement stats grouped by hour
    @Query("SELECT DATE(us.startTime) as date, HOUR(us.startTime) as hour, " +
           "SUM(us.pageCount) as totalPageViews, " +
           "COUNT(us) as totalSessions " +
           "FROM UserSession us " +
           "WHERE us.startTime BETWEEN :start AND :end " +
           "GROUP BY DATE(us.startTime), HOUR(us.startTime) " +
           "ORDER BY date, hour")
    List<Object[]> getEngagementStatsByHour(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Get engagement stats grouped by week
    @Query("SELECT YEARWEEK(us.startTime) as week, " +
           "SUM(us.pageCount) as totalPageViews, " +
           "COUNT(us) as totalSessions " +
           "FROM UserSession us " +
           "WHERE us.startTime BETWEEN :start AND :end " +
           "GROUP BY YEARWEEK(us.startTime) " +
           "ORDER BY week")
    List<Object[]> getEngagementStatsByWeek(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Get engagement stats grouped by month
    @Query("SELECT YEAR(us.startTime) as year, MONTH(us.startTime) as month, " +
           "SUM(us.pageCount) as totalPageViews, " +
           "COUNT(us) as totalSessions " +
           "FROM UserSession us " +
           "WHERE us.startTime BETWEEN :start AND :end " +
           "GROUP BY YEAR(us.startTime), MONTH(us.startTime) " +
           "ORDER BY year, month")
    List<Object[]> getEngagementStatsByMonth(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Get customer segmentation statistics
    @Query("SELECT us.userId, " +
           "SUM(us.pageCount) as totalPageViews, " +
           "COUNT(us) as sessionCount " +
           "FROM UserSession us " +
           "WHERE us.startTime BETWEEN :start AND :end " +
           "AND us.userId != -1 " +
           "GROUP BY us.userId " +
           "ORDER BY totalPageViews DESC")
    List<Object[]> getCustomerSegmentationStats(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Get customer acquisition statistics
    @Query(value = "SELECT DATE(us.start_time) as date, " +
           "COUNT(DISTINCT us.user_id) as acquired, " +
           "COUNT(CASE WHEN us.page_count <= 1 THEN 1 END) as churned, " +
           "COUNT(DISTINCT us.user_id) - COUNT(CASE WHEN us.page_count <= 1 THEN 1 END) as retained " +
           "FROM user_sessions us " +
           "WHERE us.start_time BETWEEN :start AND :end " +
           "AND us.user_id != -1 " +
           "GROUP BY DATE(us.start_time) " +
           "ORDER BY date", nativeQuery = true)
    List<Object[]> getCustomerAcquisitionStats(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Get customer acquisition statistics by hour
    @Query(value = "SELECT DATE(us.start_time) as date, HOUR(us.start_time) as hour, " +
           "COUNT(DISTINCT us.user_id) as acquired, " +
           "COUNT(CASE WHEN us.page_count <= 1 THEN 1 END) as churned, " +
           "COUNT(DISTINCT us.user_id) - COUNT(CASE WHEN us.page_count <= 1 THEN 1 END) as retained " +
           "FROM user_sessions us " +
           "WHERE us.start_time BETWEEN :start AND :end " +
           "AND us.user_id != -1 " +
           "GROUP BY DATE(us.start_time), HOUR(us.start_time) " +
           "ORDER BY date, hour", nativeQuery = true)
    List<Object[]> getCustomerAcquisitionStatsByHour(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Get customer acquisition statistics by week
    @Query(value = "SELECT YEARWEEK(us.start_time) as week, " +
           "COUNT(DISTINCT us.user_id) as acquired, " +
           "COUNT(CASE WHEN us.page_count <= 1 THEN 1 END) as churned, " +
           "COUNT(DISTINCT us.user_id) - COUNT(CASE WHEN us.page_count <= 1 THEN 1 END) as retained " +
           "FROM user_sessions us " +
           "WHERE us.start_time BETWEEN :start AND :end " +
           "AND us.user_id != -1 " +
           "GROUP BY YEARWEEK(us.start_time) " +
           "ORDER BY week", nativeQuery = true)
    List<Object[]> getCustomerAcquisitionStatsByWeek(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Get customer acquisition statistics by month
    @Query(value = "SELECT YEAR(us.start_time) as year, MONTH(us.start_time) as month, " +
           "COUNT(DISTINCT us.user_id) as acquired, " +
           "COUNT(CASE WHEN us.page_count <= 1 THEN 1 END) as churned, " +
           "COUNT(DISTINCT us.user_id) - COUNT(CASE WHEN us.page_count <= 1 THEN 1 END) as retained " +
           "FROM user_sessions us " +
           "WHERE us.start_time BETWEEN :start AND :end " +
           "AND us.user_id != -1 " +
           "GROUP BY YEAR(us.start_time), MONTH(us.start_time) " +
           "ORDER BY year, month", nativeQuery = true)
    List<Object[]> getCustomerAcquisitionStatsByMonth(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Get VIP tier statistics using vip_tiers table
    @Query(value = "SELECT " +
           "vt.name, " +
           "COUNT(CASE WHEN u.total_points >= vt.min_points THEN 1 END) as user_count " +
           "FROM vip_tiers vt " +
           "LEFT JOIN users u ON u.role_id = 6 " +
           "GROUP BY vt.name, vt.min_points " +
           "ORDER BY vt.min_points", nativeQuery = true)
    List<Object[]> getVipTierStats();
    
    // Alternative simpler VIP tier statistics
    @Query(value = "SELECT " +
           "'Regular' as tier_name, " +
           "COUNT(CASE WHEN total_points < 10000 THEN 1 END) as user_count " +
           "FROM users WHERE role_id = 6 " +
           "UNION ALL " +
           "SELECT " +
           "'Silver' as tier_name, " +
           "COUNT(CASE WHEN total_points >= 10000 AND total_points < 100000 THEN 1 END) as user_count " +
           "FROM users WHERE role_id = 6 " +
           "UNION ALL " +
           "SELECT " +
           "'Gold' as tier_name, " +
           "COUNT(CASE WHEN total_points >= 100000 AND total_points < 1000000 THEN 1 END) as user_count " +
           "FROM users WHERE role_id = 6 " +
           "UNION ALL " +
           "SELECT " +
           "'Platinum' as tier_name, " +
           "COUNT(CASE WHEN total_points >= 1000000 THEN 1 END) as user_count " +
           "FROM users WHERE role_id = 6", nativeQuery = true)
    List<Object[]> getVipTierStatsSimple();
    
    // Get all VIP tiers from vip_tiers table
    @Query(value = "SELECT name, min_points FROM vip_tiers ORDER BY min_points", nativeQuery = true)
    List<Object[]> getAllVipTiers();
    
    // Test query to check if we have any users
    @Query(value = "SELECT COUNT(*) as total_users, COUNT(total_points) as users_with_points, MIN(total_points) as min_points, MAX(total_points) as max_points FROM users WHERE role_id = 6", nativeQuery = true)
    List<Object[]> getUserStats();
    
    // Direct user count by tier using vip_tiers table min_points
    @Query(value = "SELECT " +
           "vt.name, " +
           "COUNT(CASE WHEN u.total_points >= vt.min_points THEN 1 END) as user_count " +
           "FROM vip_tiers vt " +
           "LEFT JOIN users u ON u.role_id = 6 " +
           "GROUP BY vt.name, vt.min_points " +
           "ORDER BY vt.min_points", nativeQuery = true)
    List<Object[]> getDirectUserCount();
    
    // Dynamic VIP tier calculation that works with any tier names from vip_tiers table
    @Query(value = "WITH tier_assignments AS (" +
           "  SELECT u.id, u.total_points, " +
           "         COALESCE(" +
           "           (SELECT vt.name " +
           "            FROM vip_tiers vt " +
           "            WHERE u.total_points >= vt.min_points " +
           "            ORDER BY vt.min_points DESC " +
           "            LIMIT 1), " +
           "           'Regular' " +
           "         ) as assigned_tier " +
           "  FROM users u " +
           "  WHERE u.role_id = 6 " +
           "), " +
           "all_tiers AS (" +
           "  SELECT name, min_points FROM vip_tiers " +
           "  UNION " +
           "  SELECT 'Regular' as name, 0 as min_points " +
           "  ORDER BY min_points " +
           ") " +
           "SELECT " +
           "  at.name, " +
           "  COUNT(ta.id) as user_count " +
           "FROM all_tiers at " +
           "LEFT JOIN tier_assignments ta ON at.name = ta.assigned_tier " +
           "GROUP BY at.name, at.min_points " +
           "ORDER BY at.min_points", nativeQuery = true)
    List<Object[]> getCorrectVipTierStats();
    

} 