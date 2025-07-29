# Activity Logging System

This document describes the comprehensive activity logging system implemented for the e-commerce application. The system automatically tracks all user activities including login, logout, create, update, delete, export, import, and other operations across all entities.

## Features

### 🔍 **Comprehensive Activity Tracking**
- **Login/Logout**: Track user authentication events
- **CRUD Operations**: Create, Read, Update, Delete for all entities
- **Data Operations**: Export, Import, View activities
- **Security Events**: Failed login attempts, unauthorized access
- **System Events**: Backup, maintenance, configuration changes

### 📊 **Advanced Filtering & Search**
- Date range filtering
- User-based filtering
- Action type filtering
- Severity level filtering
- IP address filtering
- Full-text search in descriptions
- Entity type filtering

### 📈 **Real-time Statistics**
- Total activity counts
- User activity statistics
- Critical event tracking
- Action type distribution
- Severity level distribution
- Entity type distribution

### 🎨 **Modern UI**
- Glassmorphism design
- Responsive layout
- Real-time updates
- Export functionality (CSV, JSON, PDF)
- Detailed activity views
- Interactive filters

## Backend Implementation

### 1. Entity Structure

```java
@Entity
@Table(name = "activity_logs")
public class ActivityLog {
    private Long id;
    private Long userId;
    private String userName;
    private String userRole;
    private String actionType; // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    private String entityType; // PRODUCT, CATEGORY, BRAND, USER, ORDER, etc.
    private String entityId;
    private String description;
    private String severityLevel; // LOW, MEDIUM, HIGH, CRITICAL
    private String ipAddress;
    private String userAgent;
    private String sessionId;
    private LocalDateTime timestamp;
    private String details; // JSON string for additional details
    private String changes; // JSON string for before/after changes
    private String status; // SUCCESS, FAILED, PENDING
    private String errorMessage;
}
```

### 2. Automatic Logging with @LogActivity Annotation

Add the `@LogActivity` annotation to any controller method to automatically log activities:

```java
@LogActivity(
    actionType = "CREATE",
    entityType = "PRODUCT",
    description = "Created new product",
    severityLevel = "MEDIUM",
    entityIdParam = "productId",
    entityNameParam = "productName"
)
@PostMapping("/product")
public ResponseEntity<?> createProduct(@RequestParam String productId, 
                                     @RequestParam String productName) {
    // Your business logic here
    return ResponseEntity.ok("Product created");
}
```

### 3. Annotation Parameters

- `actionType`: The type of action (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.)
- `entityType`: The type of entity being affected (PRODUCT, CATEGORY, USER, etc.)
- `description`: Custom description for the activity
- `severityLevel`: LOW, MEDIUM, HIGH, CRITICAL
- `logChanges`: Whether to track before/after changes
- `entityIdParam`: Parameter name containing the entity ID
- `entityNameParam`: Parameter name containing the entity name

### 4. Service Layer

The `ActivityLogService` provides comprehensive functionality:

```java
@Service
public class ActivityLogService {
    // Create activity logs
    ActivityLog createActivityLog(Long userId, String userName, String userRole, 
                                String actionType, String entityType, String entityId, 
                                String description, String severityLevel, 
                                String ipAddress, String userAgent, String sessionId);
    
    // Get filtered activity logs
    ActivityLogResponseDto getActivityLogs(ActivityLogFilterDto filterDto);
    
    // Get statistics
    Map<String, Object> getActivityStatistics();
    
    // Export functionality
    byte[] exportActivityLogs(ActivityLogFilterDto filterDto, String format);
}
```

### 5. Repository Layer

Advanced querying capabilities:

```java
@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    // Complex search with multiple filters
    Page<ActivityLog> findWithFilters(Long userId, String actionType, 
                                     String entityType, String severityLevel,
                                     String ipAddress, String searchTerm,
                                     LocalDateTime startDate, LocalDateTime endDate,
                                     Pageable pageable);
    
    // Statistics queries
    List<Object[]> countByActionType();
    List<Object[]> countBySeverityLevel();
    List<Object[]> countByEntityType();
}
```

## Frontend Implementation

### 1. Service Layer

```typescript
@Injectable()
export class ActivityLogService {
    // Get activity logs with filters
    getActivityLogs(filter: ActivityLogFilter): Observable<ActivityLogResponse>;
    
    // Get statistics
    getActivityStatistics(): Observable<ActivityStatistics>;
    
    // Export functionality
    exportActivityLogs(filter: ActivityLogFilter, format: string): Observable<Blob>;
}
```

### 2. Component Features

- **Real-time filtering**: Apply multiple filters simultaneously
- **Pagination**: Efficient handling of large datasets
- **Export functionality**: CSV, JSON, PDF export
- **Statistics dashboard**: Real-time activity statistics
- **Detailed views**: Modal dialogs for detailed activity information

## Usage Examples

### 1. Adding Activity Logging to Existing Controllers

```java
// Product Controller
@LogActivity(actionType = "CREATE", entityType = "PRODUCT", severityLevel = "MEDIUM")
@PostMapping("/create")
public ResponseEntity<?> createProduct(@RequestBody ProductDTO product) {
    // Your existing logic
    return ResponseEntity.ok("Product created");
}

// User Controller
@LogActivity(actionType = "LOGIN", entityType = "USER", severityLevel = "LOW")
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    // Your existing logic
    return ResponseEntity.ok("Login successful");
}

// Order Controller
@LogActivity(actionType = "UPDATE", entityType = "ORDER", severityLevel = "HIGH")
@PutMapping("/{orderId}/status")
public ResponseEntity<?> updateOrderStatus(@PathVariable Long orderId, 
                                         @RequestParam String status) {
    // Your existing logic
    return ResponseEntity.ok("Order status updated");
}
```

### 2. Manual Activity Logging

```java
@Autowired
private ActivityLogService activityLogService;

public void someBusinessMethod() {
    // Your business logic
    
    // Log the activity manually
    activityLogService.createActivityLog(
        userId, userName, userRole,
        "CREATE", "PRODUCT", productId.toString(),
        "Created new product: " + productName,
        "MEDIUM", ipAddress, userAgent, sessionId
    );
}
```

### 3. Frontend Integration

```typescript
// Load activity logs
this.activityLogService.getActivityLogs(filter).subscribe({
    next: (response) => {
        this.logs = response.logs;
        this.totalPages = response.totalPages;
    },
    error: (error) => console.error('Error loading logs:', error)
});

// Export logs
this.activityLogService.exportActivityLogs(filter, 'csv').subscribe({
    next: (blob) => {
        // Handle file download
    }
});
```

## Database Schema

```sql
CREATE TABLE activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    user_name VARCHAR(255),
    user_role VARCHAR(100),
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(255),
    description VARCHAR(1000),
    severity_level VARCHAR(20),
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    timestamp DATETIME NOT NULL,
    details TEXT,
    changes TEXT,
    status VARCHAR(20),
    error_message TEXT,
    INDEX idx_user_id (user_id),
    INDEX idx_action_type (action_type),
    INDEX idx_entity_type (entity_type),
    INDEX idx_timestamp (timestamp),
    INDEX idx_severity_level (severity_level)
);
```

## Security Considerations

1. **Data Privacy**: Activity logs may contain sensitive information
2. **Retention Policy**: Implement automatic cleanup of old logs
3. **Access Control**: Restrict access to activity logs based on user roles
4. **Data Encryption**: Consider encrypting sensitive log data
5. **Audit Trail**: Maintain integrity of audit trail

## Performance Optimization

1. **Indexing**: Proper database indexing for frequently queried fields
2. **Pagination**: Efficient pagination for large datasets
3. **Caching**: Cache frequently accessed statistics
4. **Async Logging**: Consider async logging for high-traffic scenarios
5. **Data Archival**: Archive old logs to separate storage

## Monitoring and Alerts

1. **Critical Events**: Set up alerts for critical severity events
2. **Failed Operations**: Monitor failed operations
3. **Unusual Activity**: Detect unusual patterns in user activity
4. **System Health**: Monitor activity log system performance

## Future Enhancements

1. **Real-time Notifications**: WebSocket-based real-time activity notifications
2. **Advanced Analytics**: Machine learning for pattern detection
3. **Integration**: Integration with external monitoring systems
4. **Compliance**: GDPR and other compliance-related features
5. **Visualization**: Advanced charts and graphs for activity analysis

## Troubleshooting

### Common Issues

1. **Icons not loading**: Ensure Lucide icons are properly initialized
2. **Filter not working**: Check API endpoint and filter parameters
3. **Export failing**: Verify file permissions and format support
4. **Performance issues**: Check database indexes and query optimization

### Debug Mode

Enable debug logging in application.properties:

```properties
logging.level.com.Ojt.Ecommerce.aspects=DEBUG
logging.level.com.Ojt.Ecommerce.service.ActivityLogService=DEBUG
```

## API Endpoints

### Activity Logs
- `POST /api/activity-logs/search` - Search with filters
- `GET /api/activity-logs/{id}` - Get by ID
- `GET /api/activity-logs/recent` - Recent activities
- `GET /api/activity-logs/critical` - Critical activities

### Statistics
- `GET /api/activity-logs/statistics` - General statistics
- `GET /api/activity-logs/statistics/action-types` - Action type counts
- `GET /api/activity-logs/statistics/severity-levels` - Severity level counts

### Export
- `POST /api/activity-logs/export?format=csv` - Export logs

### Management
- `PUT /api/activity-logs/{id}/status` - Update log status
- `DELETE /api/activity-logs/cleanup` - Cleanup old logs

This comprehensive activity logging system provides complete visibility into all user activities while maintaining performance and security standards. 