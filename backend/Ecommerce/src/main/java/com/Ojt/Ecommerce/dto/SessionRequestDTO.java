package com.Ojt.Ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class SessionRequestDTO {
    
    @JsonProperty("userId")
    private Long userId;
    
    @JsonProperty("sessionId")
    private String sessionId;
    
    @JsonProperty("userAgent")
    private String userAgent = "Unknown";
    
    @JsonProperty("ipAddress")
    private String ipAddress = "Unknown";
    
    // Validation methods
    public boolean isValid() {
        return sessionId != null && !sessionId.trim().isEmpty() && 
               sessionId.matches("^[a-zA-Z0-9_-]+$");
    }
    
    public String getValidationError() {
        if (sessionId == null || sessionId.trim().isEmpty()) {
            return "sessionId is required";
        }
        if (!sessionId.matches("^[a-zA-Z0-9_-]+$")) {
            return "Invalid sessionId format";
        }
        return null;
    }
} 