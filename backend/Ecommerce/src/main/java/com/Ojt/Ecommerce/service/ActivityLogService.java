package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.ActivityLogDto;
import com.Ojt.Ecommerce.dto.ActivityLogFilterDto;
import com.Ojt.Ecommerce.dto.ActivityLogResponseDto;
import com.Ojt.Ecommerce.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface ActivityLogService {
    
    // Create activity log
    ActivityLog createActivityLog(ActivityLog activityLog);
    
    // Create activity log with user context
    ActivityLog createActivityLog(Long userId, String userName, String userRole, 
                                 String actionType, String entityType, String entityId, 
                                 String description, String severityLevel, String ipAddress, 
                                 String userAgent, String sessionId);
    
    // Get activity logs with filters
    ActivityLogResponseDto getActivityLogs(ActivityLogFilterDto filterDto);
    
    // Get activity log by ID
    ActivityLogDto getActivityLogById(Long id);
    
    // Get recent activity logs
    Page<ActivityLogDto> getRecentActivityLogs(Pageable pageable);
    
    // Get critical activity logs
    Page<ActivityLogDto> getCriticalActivityLogs(Pageable pageable);
    
    // Get activity logs by user
    Page<ActivityLogDto> getActivityLogsByUser(Long userId, Pageable pageable);
    
    // Get activity logs by action type
    Page<ActivityLogDto> getActivityLogsByActionType(String actionType, Pageable pageable);
    
    // Get activity logs by entity type
    Page<ActivityLogDto> getActivityLogsByEntityType(String entityType, Pageable pageable);
    
    // Get activity logs by severity level
    Page<ActivityLogDto> getActivityLogsBySeverityLevel(String severityLevel, Pageable pageable);
    
    // Get activity logs by time range
    Page<ActivityLogDto> getActivityLogsByTimeRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    
    // Get activity statistics
    Map<String, Object> getActivityStatistics();
    
    // Get activity counts by action type
    Map<String, Long> getActivityCountsByActionType();
    
    // Get activity counts by severity level
    Map<String, Long> getActivityCountsBySeverityLevel();
    
    // Get activity counts by entity type
    Map<String, Long> getActivityCountsByEntityType();
    
    // Get activity counts by user role
    Map<String, Long> getActivityCountsByUserRole();
    
    // Get unique users who performed activities
    List<Map<String, Object>> getUniqueUsers();
    
    // Export activity logs
    byte[] exportActivityLogs(ActivityLogFilterDto filterDto, String format);
    
    // Delete old activity logs (cleanup)
    void deleteOldActivityLogs(int daysToKeep);
    
    // Update activity log status
    ActivityLog updateActivityLogStatus(Long id, String status, String errorMessage);
} 