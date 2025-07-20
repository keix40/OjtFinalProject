package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.ActivityLogDto;
import com.Ojt.Ecommerce.dto.ActivityLogFilterDto;
import com.Ojt.Ecommerce.dto.ActivityLogResponseDto;
import com.Ojt.Ecommerce.entity.ActivityLog;
import com.Ojt.Ecommerce.repository.ActivityLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ActivityLogServiceImpl implements ActivityLogService {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public ActivityLog createActivityLog(ActivityLog activityLog) {
        return activityLogRepository.save(activityLog);
    }

    @Override
    public ActivityLog createActivityLog(Long userId, String userName, String userRole, 
                                       String actionType, String entityType, String entityId, 
                                       String description, String severityLevel, String ipAddress, 
                                       String userAgent, String sessionId) {
        ActivityLog activityLog = new ActivityLog(userId, userName, userRole, actionType, 
                                                entityType, entityId, description, severityLevel);
        activityLog.setIpAddress(ipAddress);
        activityLog.setUserAgent(userAgent);
        activityLog.setSessionId(sessionId);
        activityLog.setStatus("SUCCESS");
        activityLog.setTimestamp(LocalDateTime.now());
        
        return activityLogRepository.save(activityLog);
    }

    @Override
    public ActivityLogResponseDto getActivityLogs(ActivityLogFilterDto filterDto) {
        int page = filterDto.getPage() != null ? filterDto.getPage() : 0;
        int size = filterDto.getSize() != null ? filterDto.getSize() : 25;
        Pageable pageable = PageRequest.of(page, size);

        LocalDateTime startDate = null;
        LocalDateTime endDate = null;
        
        if (filterDto.getDateFrom() != null && !filterDto.getDateFrom().isEmpty()) {
            startDate = LocalDateTime.parse(filterDto.getDateFrom() + "T00:00:00");
        }
        if (filterDto.getDateTo() != null && !filterDto.getDateTo().isEmpty()) {
            endDate = LocalDateTime.parse(filterDto.getDateTo() + "T23:59:59");
        }

        Page<ActivityLog> pageResult = activityLogRepository.findWithFilters(
                filterDto.getUserId(),
                null, // actionType - we'll filter this in memory for multiple values
                filterDto.getEntityType(),
                null, // severityLevel - we'll filter this in memory for multiple values
                filterDto.getIpAddress(),
                filterDto.getSearchTerm(),
                startDate,
                endDate,
                pageable
        );

        // Apply additional filters in memory
        List<ActivityLog> filteredLogs = pageResult.getContent().stream()
                .filter(log -> filterDto.getActionTypes() == null || 
                        filterDto.getActionTypes().isEmpty() || 
                        filterDto.getActionTypes().contains(log.getActionType()))
                .filter(log -> filterDto.getSeverityLevels() == null || 
                        filterDto.getSeverityLevels().isEmpty() || 
                        filterDto.getSeverityLevels().contains(log.getSeverityLevel()))
                .collect(Collectors.toList());

        List<ActivityLogDto> logDtos = filteredLogs.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return new ActivityLogResponseDto(
                logDtos,
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                pageResult.getNumber(),
                pageResult.getSize()
        );
    }

    @Override
    public ActivityLogDto getActivityLogById(Long id) {
        ActivityLog activityLog = activityLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity log not found"));
        return convertToDto(activityLog);
    }

    @Override
    public Page<ActivityLogDto> getRecentActivityLogs(Pageable pageable) {
        Page<ActivityLog> page = activityLogRepository.findRecentActivity(pageable);
        return page.map(this::convertToDto);
    }

    @Override
    public Page<ActivityLogDto> getCriticalActivityLogs(Pageable pageable) {
        Page<ActivityLog> page = activityLogRepository.findCriticalActivities(pageable);
        return page.map(this::convertToDto);
    }

    @Override
    public Page<ActivityLogDto> getActivityLogsByUser(Long userId, Pageable pageable) {
        Page<ActivityLog> page = activityLogRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
        return page.map(this::convertToDto);
    }

    @Override
    public Page<ActivityLogDto> getActivityLogsByActionType(String actionType, Pageable pageable) {
        Page<ActivityLog> page = activityLogRepository.findByActionTypeOrderByTimestampDesc(actionType, pageable);
        return page.map(this::convertToDto);
    }

    @Override
    public Page<ActivityLogDto> getActivityLogsByEntityType(String entityType, Pageable pageable) {
        Page<ActivityLog> page = activityLogRepository.findByEntityTypeOrderByTimestampDesc(entityType, pageable);
        return page.map(this::convertToDto);
    }

    @Override
    public Page<ActivityLogDto> getActivityLogsBySeverityLevel(String severityLevel, Pageable pageable) {
        Page<ActivityLog> page = activityLogRepository.findBySeverityLevelOrderByTimestampDesc(severityLevel, pageable);
        return page.map(this::convertToDto);
    }

    @Override
    public Page<ActivityLogDto> getActivityLogsByTimeRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        Page<ActivityLog> page = activityLogRepository.findByTimestampBetweenOrderByTimestampDesc(startDate, endDate, pageable);
        return page.map(this::convertToDto);
    }

    @Override
    public Map<String, Object> getActivityStatistics() {
        Object[] stats = activityLogRepository.getActivityStatistics();
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalLogs", stats.length > 0 ? stats[0] : 0);
        statistics.put("uniqueUsers", stats.length > 1 ? stats[1] : 0);
        statistics.put("criticalEvents", stats.length > 2 ? stats[2] : 0);
        return statistics;
    }

    @Override
    public Map<String, Long> getActivityCountsByActionType() {
        List<Object[]> results = activityLogRepository.countByActionType();
        return results.stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    @Override
    public Map<String, Long> getActivityCountsBySeverityLevel() {
        List<Object[]> results = activityLogRepository.countBySeverityLevel();
        return results.stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    @Override
    public Map<String, Long> getActivityCountsByEntityType() {
        List<Object[]> results = activityLogRepository.countByEntityType();
        return results.stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    @Override
    public Map<String, Long> getActivityCountsByUserRole() {
        List<Object[]> results = activityLogRepository.countByUserRole();
        return results.stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    @Override
    public List<Map<String, Object>> getUniqueUsers() {
        List<Object[]> results = activityLogRepository.findUniqueUsers();
        return results.stream()
                .map(row -> {
                    Map<String, Object> user = new HashMap<>();
                    user.put("userId", row[0]);
                    user.put("userName", row[1]);
                    user.put("userRole", row[2]);
                    return user;
                })
                .collect(Collectors.toList());
    }

    @Override
    public byte[] exportActivityLogs(ActivityLogFilterDto filterDto, String format) {
        // Implementation for export functionality
        // This would generate CSV, JSON, or PDF based on format
        return new byte[0]; // Placeholder
    }

    @Override
    public void deleteOldActivityLogs(int daysToKeep) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
        // Implementation for cleanup
    }

    @Override
    public ActivityLog updateActivityLogStatus(Long id, String status, String errorMessage) {
        ActivityLog activityLog = activityLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity log not found"));
        activityLog.setStatus(status);
        activityLog.setErrorMessage(errorMessage);
        return activityLogRepository.save(activityLog);
    }

    // Helper method to convert entity to DTO
    private ActivityLogDto convertToDto(ActivityLog activityLog) {
        ActivityLogDto dto = new ActivityLogDto(
                activityLog.getId(),
                activityLog.getUserId(),
                activityLog.getUserName(),
                activityLog.getUserRole(),
                activityLog.getActionType(),
                activityLog.getEntityType(),
                activityLog.getEntityId(),
                activityLog.getDescription(),
                activityLog.getSeverityLevel(),
                activityLog.getTimestamp()
        );
        dto.setIpAddress(activityLog.getIpAddress());
        dto.setUserAgent(activityLog.getUserAgent());
        dto.setSessionId(activityLog.getSessionId());
        dto.setDetails(activityLog.getDetails());
        dto.setChanges(activityLog.getChanges());
        dto.setStatus(activityLog.getStatus());
        dto.setErrorMessage(activityLog.getErrorMessage());
        return dto;
    }

    // Helper method to create activity log with changes tracking
    public ActivityLog createActivityLogWithChanges(Long userId, String userName, String userRole,
                                                  String actionType, String entityType, String entityId,
                                                  String description, String severityLevel,
                                                  String ipAddress, String userAgent, String sessionId,
                                                  Map<String, Object> changes) {
        ActivityLog activityLog = new ActivityLog(userId, userName, userRole, actionType,
                                                entityType, entityId, description, severityLevel);
        activityLog.setIpAddress(ipAddress);
        activityLog.setUserAgent(userAgent);
        activityLog.setSessionId(sessionId);
        activityLog.setStatus("SUCCESS");
        activityLog.setTimestamp(LocalDateTime.now());
        
        if (changes != null && !changes.isEmpty()) {
            try {
                activityLog.setChanges(objectMapper.writeValueAsString(changes));
            } catch (JsonProcessingException e) {
                activityLog.setChanges("Error serializing changes: " + e.getMessage());
            }
        }
        
        return activityLogRepository.save(activityLog);
    }
} 