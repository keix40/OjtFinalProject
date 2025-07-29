package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.BlacklistEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface BlacklistService {
    BlacklistEntry addEntry(BlacklistEntry entry);
    
    BlacklistEntry updateEntry(String id, BlacklistEntry entry);
    
    BlacklistEntry getEntry(String id);
    
    void deleteEntry(String id);
    
    Page<BlacklistEntry> getEntries(String search, String category, String status, 
                                  String riskLevel, Pageable pageable);
    
    Map<String, Object> getStats();
    
    BlacklistEntry liftBan(String id);
    
    void bulkLiftBan(List<String> ids);
    
    BlacklistEntry addNote(String id, String note);
    
    BlacklistEntry extendBan(String id, LocalDateTime newExpiryDate);
    
    void bulkExtendBan(List<String> ids, LocalDateTime newExpiryDate);
    
    void bulkUpdateCategory(List<String> ids, String category);
    
    byte[] exportEntries(String search, String category, String status, String riskLevel);
    
    List<Map<String, Object>> getIncidentHistory(String id);
    
    Map<String, Boolean> getAutoRules();
    
    Map<String, Boolean> updateAutoRules(Map<String, Boolean> rules);
    
    // Method to get active blacklist entry by email
    BlacklistEntry getActiveBlacklistByEmail(String email);
    
    // Method to get blacklist entry by email and status
    BlacklistEntry getBlacklistByEmailAndStatus(String email, BlacklistEntry.Status status);
    
    List<Map<String, Object>> findRelatedAccounts(String targetType, String targetValue);
} 