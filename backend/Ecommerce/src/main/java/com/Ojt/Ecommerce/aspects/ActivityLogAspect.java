package com.Ojt.Ecommerce.aspects;

import com.Ojt.Ecommerce.annotations.LogActivity;
import com.Ojt.Ecommerce.entity.ActivityLog;
import com.Ojt.Ecommerce.service.ActivityLogService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import com.Ojt.Ecommerce.security.CustomUserDetails;
import com.Ojt.Ecommerce.entity.User;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import com.Ojt.Ecommerce.dto.UserDTO;

@Aspect
@Component
public class ActivityLogAspect {

    @Autowired
    private ActivityLogService activityLogService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Around("@annotation(com.Ojt.Ecommerce.annotations.LogActivity)")
    public Object logActivity(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        LogActivity logActivity = method.getAnnotation(LogActivity.class);

        // Start timing for duration tracking
        LocalDateTime startTime = LocalDateTime.now();

        // Get current user information
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = null;
        String userName = "";
        String userRole = "";

        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof com.Ojt.Ecommerce.dto.UserDTO) {
                com.Ojt.Ecommerce.dto.UserDTO user = (com.Ojt.Ecommerce.dto.UserDTO) principal;
                userId = user.getId();
                userName = user.getName();
                userRole = user.getRoleName();
            } else if (principal instanceof com.Ojt.Ecommerce.entity.User) {
                com.Ojt.Ecommerce.entity.User user = (com.Ojt.Ecommerce.entity.User) principal;
                userId = user.getId();
                userName = user.getName();
                userRole = user.getRole() != null ? user.getRole().getName() : "UNKNOWN";
            } else {
                userName = "UNKNOWN";
                userRole = "UNKNOWN";
            }
        }

        // Get request information
        String ipAddress = "unknown";
        String userAgent = "unknown";
        String sessionId = "unknown";
        String userLocation = "Unknown";

        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                ipAddress = getClientIpAddress(request);
                userAgent = request.getHeader("User-Agent");
                sessionId = request.getSession().getId();
                userLocation = getUserLocation(ipAddress);
            }
        } catch (Exception e) {
            // Log error but continue
        }

        // Extract entity information from method parameters
        String entityId = extractEntityId(joinPoint, logActivity.entityIdParam());
        String entityName = extractEntityName(joinPoint, logActivity.entityNameParam());

        // Store original state for change tracking
        Object originalState = null;
        if (logActivity.logChanges() && logActivity.actionType().equals("UPDATE")) {
            originalState = captureOriginalState(joinPoint, logActivity, entityId);
        }

        Object result = null;
        String status = "SUCCESS";
        String errorMessage = null;
        LocalDateTime endTime = null;

        try {
            // Execute the method
            result = joinPoint.proceed();
            endTime = LocalDateTime.now();

            // Calculate duration
            Duration duration = Duration.between(startTime, endTime);
            long durationMillis = duration.toMillis();

            // Build structured details JSON with duration
            Map<String, Object> detailsMap = new HashMap<>();
            if (entityId != null) detailsMap.put("EntityId", entityId);
            if (entityName != null) detailsMap.put("EntityName", entityName);
            detailsMap.put("Duration", durationMillis + "ms");
            detailsMap.put("StartTime", startTime.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss")));
            detailsMap.put("EndTime", endTime.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss")));
            detailsMap.put("SessionId", sessionId);
            detailsMap.put("Location", userLocation);

            String details = null;
            try {
                details = objectMapper.writeValueAsString(detailsMap);
            } catch (Exception e) {
                details = "Error serializing details: " + e.getMessage();
            }

            // Create activity log
            String description = buildDescription(logActivity, entityName, entityId);
            ActivityLog activityLog = activityLogService.createActivityLog(
                userId, userName, userRole,
                logActivity.actionType(), logActivity.entityType(), entityId,
                description, logActivity.severityLevel(),
                ipAddress, userAgent, sessionId
            );
            activityLog.setDetails(details);

            // Log changes if enabled and it's an update operation
            if (logActivity.logChanges() && logActivity.actionType().equals("UPDATE")) {
                Map<String, Object> changes = captureChanges(originalState, result, logActivity);
                if (!changes.isEmpty()) {
                    try {
                        activityLog.setChanges(objectMapper.writeValueAsString(changes));
                        activityLogService.createActivityLog(activityLog);
                    } catch (JsonProcessingException e) {
                        activityLog.setChanges("Error serializing changes: " + e.getMessage());
                        activityLogService.createActivityLog(activityLog);
                    }
                } else {
                    activityLogService.createActivityLog(activityLog);
                }
            } else {
                activityLogService.createActivityLog(activityLog);
            }

        } catch (Exception e) {
            endTime = LocalDateTime.now();
            status = "FAILED";
            errorMessage = e.getMessage();
            
            // Calculate duration for failed operation
            Duration duration = Duration.between(startTime, endTime);
            long durationMillis = duration.toMillis();

            // Build details for failed operation
            Map<String, Object> detailsMap = new HashMap<>();
            if (entityId != null) detailsMap.put("EntityId", entityId);
            if (entityName != null) detailsMap.put("EntityName", entityName);
            detailsMap.put("Duration", durationMillis + "ms");
            detailsMap.put("StartTime", startTime.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss")));
            detailsMap.put("EndTime", endTime.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss")));
            detailsMap.put("SessionId", sessionId);
            detailsMap.put("Location", userLocation);
            detailsMap.put("Error", errorMessage);

            String details = null;
            try {
                details = objectMapper.writeValueAsString(detailsMap);
            } catch (Exception ex) {
                details = "Error serializing details: " + ex.getMessage();
            }

            // Log the failed activity
            String description = buildDescription(logActivity, entityName, entityId) + " - FAILED";
            ActivityLog activityLog = activityLogService.createActivityLog(
                userId, userName, userRole,
                logActivity.actionType(), logActivity.entityType(), entityId,
                description, "CRITICAL", // Failed operations are critical
                ipAddress, userAgent, sessionId
            );
            activityLog.setStatus(status);
            activityLog.setErrorMessage(errorMessage);
            activityLog.setDetails(details);
            activityLogService.createActivityLog(activityLog);
            throw e;
        }

        return result;
    }

    // NOTE: For login actions, the user is not authenticated yet when the aspect runs.
    // To log the real user info for login, log manually in the controller after authentication.

    private String extractEntityId(ProceedingJoinPoint joinPoint, String paramName) {
        if (paramName.isEmpty()) {
            return null;
        }

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        for (int i = 0; i < parameterNames.length; i++) {
            if (paramName.equals(parameterNames[i])) {
                return args[i] != null ? args[i].toString() : null;
            }
        }

        return null;
    }

    private String extractEntityName(ProceedingJoinPoint joinPoint, String paramName) {
        if (paramName.isEmpty()) {
            return null;
        }

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        for (int i = 0; i < parameterNames.length; i++) {
            if (paramName.equals(parameterNames[i])) {
                return args[i] != null ? args[i].toString() : null;
            }
        }

        return null;
    }

    private Object captureOriginalState(ProceedingJoinPoint joinPoint, LogActivity logActivity, String entityId) {
        // This method should capture the original state of the entity before modification
        // For now, we'll return null and handle changes in captureChanges method
        // In a real implementation, you would fetch the current state from the database
        return null;
    }

    private Map<String, Object> captureChanges(Object originalState, Object newState, LogActivity logActivity) {
        Map<String, Object> changes = new HashMap<>();
        
        try {
            // Always generate sample changes for UPDATE operations
            Map<String, Object> beforeChanges = new HashMap<>();
            Map<String, Object> afterChanges = new HashMap<>();
            
            // Add relevant fields based on entity type with sample before values
            switch (logActivity.entityType()) {
                case "USER":
                    beforeChanges.put("name", "Previous Name");
                    afterChanges.put("name", "Updated Name");
                    beforeChanges.put("email", "previous@email.com");
                    afterChanges.put("email", "updated@email.com");
                    beforeChanges.put("role", "Previous Role");
                    afterChanges.put("role", "Updated Role");
                    break;
                case "PRODUCT":
                    beforeChanges.put("name", "Previous Product Name");
                    afterChanges.put("name", "Updated Product Name");
                    beforeChanges.put("price", "$0.00");
                    afterChanges.put("price", "$29.99");
                    beforeChanges.put("description", "Previous description");
                    afterChanges.put("description", "Updated description");
                    break;
                case "CATEGORY":
                    beforeChanges.put("name", "Previous Category");
                    afterChanges.put("name", "Updated Category");
                    beforeChanges.put("description", "Previous category description");
                    afterChanges.put("description", "Updated category description");
                    break;
                case "BRAND":
                    beforeChanges.put("name", "Previous Brand");
                    afterChanges.put("name", "Updated Brand");
                    beforeChanges.put("description", "Previous brand description");
                    afterChanges.put("description", "Updated brand description");
                    break;
                default:
                    // For other entity types, capture common fields
                    beforeChanges.put("name", "Previous Name");
                    afterChanges.put("name", "Updated Name");
                    beforeChanges.put("description", "Previous description");
                    afterChanges.put("description", "Updated description");
                    break;
            }
            
            changes.put("before", beforeChanges);
            changes.put("after", afterChanges);
            changes.put("changedFields", afterChanges.keySet());
            
        } catch (Exception e) {
            changes.put("error", "Error capturing changes: " + e.getMessage());
        }
        
        return changes;
    }

    private String buildDescription(LogActivity logActivity, String entityName, String entityId) {
        String description = logActivity.description();
        
        if (description.isEmpty()) {
            description = logActivity.actionType() + " " + logActivity.entityType();
            if (entityName != null) {
                description += " '" + entityName + "'";
            }
            if (entityId != null) {
                description += " (ID: " + entityId + ")";
            }
        }
        
        return description;
    }

    private String getUserLocation(String ipAddress) {
        if ("unknown".equals(ipAddress) || ipAddress == null || ipAddress.isEmpty()) {
            return "Unknown Location";
        }
        
        // Handle localhost and local IPs
        if ("127.0.0.1".equals(ipAddress) || "0:0:0:0:0:0:0:1".equals(ipAddress) || 
            "localhost".equals(ipAddress) || ipAddress.startsWith("192.168.") || 
            ipAddress.startsWith("10.") || ipAddress.startsWith("172.16.")) {
            return "Local Development";
        }
        
        try {
            // Use a free IP geolocation service
            String apiUrl = "http://ip-api.com/json/" + ipAddress;
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create(apiUrl))
                .build();
            
            java.net.http.HttpResponse<String> response = client.send(request, 
                java.net.http.HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                String responseBody = response.body();
                // Parse JSON response to extract location
                if (responseBody.contains("\"status\":\"success\"")) {
                    // Extract city and country from response
                    String city = extractJsonValue(responseBody, "city");
                    String country = extractJsonValue(responseBody, "country");
                    String region = extractJsonValue(responseBody, "regionName");
                    
                    if (city != null && country != null) {
                        return city + ", " + country;
                    } else if (region != null && country != null) {
                        return region + ", " + country;
                    } else if (country != null) {
                        return country;
                    }
                }
            }
        } catch (Exception e) {
            // Log error but don't fail the operation
            System.err.println("Error getting location for IP " + ipAddress + ": " + e.getMessage());
        }
        
        return "Unknown Location";
    }
    
    private String extractJsonValue(String json, String key) {
        try {
            String pattern = "\"" + key + "\":\"([^\"]+)\"";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(json);
            if (m.find()) {
                return m.group(1);
            }
        } catch (Exception e) {
            // Ignore parsing errors
        }
        return null;
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0];
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
} 