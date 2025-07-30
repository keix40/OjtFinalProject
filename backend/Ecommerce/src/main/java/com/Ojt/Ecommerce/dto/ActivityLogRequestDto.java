package com.Ojt.Ecommerce.dto;

public class ActivityLogRequestDto {
    private String actionType;
    private String entityType;
    private String entityId;
    private String description;
    private String severityLevel;
    private String details;
    private String changes;
    private String status;

    // Getters and Setters
    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSeverityLevel() { return severityLevel; }
    public void setSeverityLevel(String severityLevel) { this.severityLevel = severityLevel; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getChanges() { return changes; }
    public void setChanges(String changes) { this.changes = changes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
} 