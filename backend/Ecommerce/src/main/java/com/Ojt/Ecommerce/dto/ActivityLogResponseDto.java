package com.Ojt.Ecommerce.dto;

import java.util.List;

public class ActivityLogResponseDto {
    private List<ActivityLogDto> logs;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int size;

    // Constructors
    public ActivityLogResponseDto() {}

    public ActivityLogResponseDto(List<ActivityLogDto> logs, long totalElements, int totalPages, int currentPage, int size) {
        this.logs = logs;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.currentPage = currentPage;
        this.size = size;
    }

    // Getters and Setters
    public List<ActivityLogDto> getLogs() { return logs; }
    public void setLogs(List<ActivityLogDto> logs) { this.logs = logs; }

    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

    public int getCurrentPage() { return currentPage; }
    public void setCurrentPage(int currentPage) { this.currentPage = currentPage; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }
} 