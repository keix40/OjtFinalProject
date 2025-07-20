package com.Ojt.Ecommerce.dto;

import java.util.List;

public class ActivityLogFilterDto {
    private String dateFrom;
    private String dateTo;
    private Long userId;
    private List<String> actionTypes;
    private List<String> severityLevels;
    private String ipAddress;
    private String searchTerm;
    private String entityType;
    private Integer page;
    private Integer size;

    // Getters and Setters
    public String getDateFrom() { return dateFrom; }
    public void setDateFrom(String dateFrom) { this.dateFrom = dateFrom; }

    public String getDateTo() { return dateTo; }
    public void setDateTo(String dateTo) { this.dateTo = dateTo; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public List<String> getActionTypes() { return actionTypes; }
    public void setActionTypes(List<String> actionTypes) { this.actionTypes = actionTypes; }

    public List<String> getSeverityLevels() { return severityLevels; }
    public void setSeverityLevels(List<String> severityLevels) { this.severityLevels = severityLevels; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getSearchTerm() { return searchTerm; }
    public void setSearchTerm(String searchTerm) { this.searchTerm = searchTerm; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public Integer getPage() { return page; }
    public void setPage(Integer page) { this.page = page; }

    public Integer getSize() { return size; }
    public void setSize(Integer size) { this.size = size; }
} 