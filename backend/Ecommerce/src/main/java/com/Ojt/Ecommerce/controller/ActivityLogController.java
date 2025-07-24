package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.ActivityLogDto;
import com.Ojt.Ecommerce.dto.ActivityLogFilterDto;
import com.Ojt.Ecommerce.dto.ActivityLogResponseDto;
import com.Ojt.Ecommerce.entity.ActivityLog;
import com.Ojt.Ecommerce.service.ActivityLogService;
import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;
import com.Ojt.Ecommerce.annotations.RequiresPermission;
import static com.Ojt.Ecommerce.constants.PermissionConstants.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activity-logs")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@PermissionCategoryTag(value = "activity_logs", name = "Activity Logs", icon = "fa-list")
public class ActivityLogController {

    @Autowired
    private ActivityLogService activityLogService;

    // Get all activity logs with filters
    @PostMapping("/search")
    @RequiresPermission(value = ACTIVITY_LOGS_VIEW, level = "basic")
    public ResponseEntity<ActivityLogResponseDto> getActivityLogs(@RequestBody ActivityLogFilterDto filterDto) {
        ActivityLogResponseDto response = activityLogService.getActivityLogs(filterDto);
        return ResponseEntity.ok(response);
    }

    // Get activity log by ID
    @GetMapping("/{id}")
    @RequiresPermission(value = ACTIVITY_LOGS_VIEW, level = "basic")
    public ResponseEntity<ActivityLogDto> getActivityLogById(@PathVariable Long id) {
        ActivityLogDto activityLog = activityLogService.getActivityLogById(id);
        return ResponseEntity.ok(activityLog);
    }

    // Get recent activity logs
    @GetMapping("/recent")
    @RequiresPermission(value = ACTIVITY_LOGS_VIEW, level = "basic")
    public ResponseEntity<Page<ActivityLogDto>> getRecentActivityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ActivityLogDto> logs = activityLogService.getRecentActivityLogs(pageable);
        return ResponseEntity.ok(logs);
    }

    // Get critical activity logs
    @GetMapping("/critical")
    @RequiresPermission(value = ACTIVITY_LOGS_VIEW, level = "basic")
    public ResponseEntity<Page<ActivityLogDto>> getCriticalActivityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ActivityLogDto> logs = activityLogService.getCriticalActivityLogs(pageable);
        return ResponseEntity.ok(logs);
    }

    // Get activity logs by user
    @GetMapping("/user/{userId}")
    @RequiresPermission(value = ACTIVITY_LOGS_VIEW, level = "basic")
    public ResponseEntity<Page<ActivityLogDto>> getActivityLogsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ActivityLogDto> logs = activityLogService.getActivityLogsByUser(userId, pageable);
        return ResponseEntity.ok(logs);
    }

    // Get activity logs by action type
    @GetMapping("/action/{actionType}")
    @RequiresPermission(value = ACTIVITY_LOGS_VIEW, level = "basic")
    public ResponseEntity<Page<ActivityLogDto>> getActivityLogsByActionType(
            @PathVariable String actionType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ActivityLogDto> logs = activityLogService.getActivityLogsByActionType(actionType, pageable);
        return ResponseEntity.ok(logs);
    }

    // Get activity logs by entity type
    @GetMapping("/entity/{entityType}")
    @RequiresPermission(value = ACTIVITY_LOGS_VIEW, level = "basic")
    public ResponseEntity<Page<ActivityLogDto>> getActivityLogsByEntityType(
            @PathVariable String entityType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ActivityLogDto> logs = activityLogService.getActivityLogsByEntityType(entityType, pageable);
        return ResponseEntity.ok(logs);
    }

    // Get activity logs by severity level
    @GetMapping("/severity/{severityLevel}")
    @RequiresPermission(value = ACTIVITY_LOGS_VIEW, level = "basic")
    public ResponseEntity<Page<ActivityLogDto>> getActivityLogsBySeverityLevel(
            @PathVariable String severityLevel,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ActivityLogDto> logs = activityLogService.getActivityLogsBySeverityLevel(severityLevel, pageable);
        return ResponseEntity.ok(logs);
    }

    // Get activity logs by time range
    @GetMapping("/time-range")
    @RequiresPermission(value = ACTIVITY_LOGS_VIEW, level = "basic")
    public ResponseEntity<Page<ActivityLogDto>> getActivityLogsByTimeRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ActivityLogDto> logs = activityLogService.getActivityLogsByTimeRange(startDate, endDate, pageable);
        return ResponseEntity.ok(logs);
    }

    // Get activity statistics
    @GetMapping("/statistics")
    @RequiresPermission(value = ACTIVITY_LOGS_VIEW, level = "basic")
    public ResponseEntity<Map<String, Object>> getActivityStatistics() {
        Map<String, Object> statistics = activityLogService.getActivityStatistics();
        return ResponseEntity.ok(statistics);
    }

    // Get activity counts by action type
    @GetMapping("/statistics/action-types")
    @RequiresPermission(value = ACTIVITY_LOGS_VIEW, level = "basic")
    public ResponseEntity<Map<String, Long>> getActivityCountsByActionType() {
        Map<String, Long> counts = activityLogService.getActivityCountsByActionType();
        return ResponseEntity.ok(counts);
    }

    // Get activity counts by severity level
    @GetMapping("/statistics/severity-levels")
    @RequiresPermission(value = ACTIVITY_LOGS_VIEW, level = "basic")
    public ResponseEntity<Map<String, Long>> getActivityCountsBySeverityLevel() {
        Map<String, Long> counts = activityLogService.getActivityCountsBySeverityLevel();
        return ResponseEntity.ok(counts);
    }

    // Get activity counts by entity type
    @GetMapping("/statistics/entity-types")
    @RequiresPermission(value = ACTIVITY_LOGS_VIEW, level = "basic")
    public ResponseEntity<Map<String, Long>> getActivityCountsByEntityType() {
        Map<String, Long> counts = activityLogService.getActivityCountsByEntityType();
        return ResponseEntity.ok(counts);
    }

    // Get activity counts by user role
    @GetMapping("/statistics/user-roles")
    @RequiresPermission(value = ACTIVITY_LOGS_VIEW, level = "basic")
    public ResponseEntity<Map<String, Long>> getActivityCountsByUserRole() {
        Map<String, Long> counts = activityLogService.getActivityCountsByUserRole();
        return ResponseEntity.ok(counts);
    }

    // Get unique users
    @GetMapping("/users")
    @RequiresPermission(value = ACTIVITY_LOGS_VIEW, level = "basic")
    public ResponseEntity<List<Map<String, Object>>> getUniqueUsers() {
        List<Map<String, Object>> users = activityLogService.getUniqueUsers();
        return ResponseEntity.ok(users);
    }

    // Export activity logs
    @PostMapping("/export")
    @RequiresPermission(value = ACTIVITY_LOGS_EXPORT, level = "advanced")
    public ResponseEntity<byte[]> exportActivityLogs(
            @RequestBody ActivityLogFilterDto filterDto,
            @RequestParam String format) {
        byte[] data = activityLogService.exportActivityLogs(filterDto, format);
        
        String filename = "activity-logs-" + LocalDateTime.now().toString().replace(":", "-") + "." + format;
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", filename);
        
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    // Update activity log status
    @PutMapping("/{id}/status")
    @RequiresPermission(value = ACTIVITY_LOGS_UPDATE, level = "advanced")
    public ResponseEntity<ActivityLog> updateActivityLogStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String errorMessage) {
        ActivityLog updatedLog = activityLogService.updateActivityLogStatus(id, status, errorMessage);
        return ResponseEntity.ok(updatedLog);
    }

    // Delete old activity logs
    @DeleteMapping("/cleanup")
    @RequiresPermission(value = ACTIVITY_LOGS_DELETE, level = "critical")
    public ResponseEntity<String> deleteOldActivityLogs(@RequestParam(defaultValue = "90") int daysToKeep) {
        activityLogService.deleteOldActivityLogs(daysToKeep);
        return ResponseEntity.ok("Old activity logs deleted successfully");
    }

    // Create activity log (for testing purposes)
    @PostMapping
    @RequiresPermission(value = ACTIVITY_LOGS_CREATE, level = "advanced")
    public ResponseEntity<ActivityLog> createActivityLog(@RequestBody ActivityLog activityLog) {
        ActivityLog createdLog = activityLogService.createActivityLog(activityLog);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdLog);
    }
} 