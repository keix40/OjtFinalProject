package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.BlacklistEntry;
import com.Ojt.Ecommerce.entity.LoginAttempt;
import com.Ojt.Ecommerce.repository.BlacklistRepository;
import com.Ojt.Ecommerce.repository.LoginAttemptRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BlacklistServiceImpl implements BlacklistService {
    private final BlacklistRepository blacklistRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final Map<String, Boolean> autoRules = new HashMap<>();

    @Override
    @Transactional
    public BlacklistEntry addEntry(BlacklistEntry entry) {
        entry.setAddedDate(LocalDateTime.now());
        entry.setStatus(BlacklistEntry.Status.ACTIVE);
        entry.setLastIncidentDate(LocalDateTime.now());
        entry.setIncidentCount(1);
        return blacklistRepository.save(entry);
    }

    @Override
    @Transactional
    public BlacklistEntry updateEntry(String id, BlacklistEntry entry) {
        BlacklistEntry existingEntry = getEntry(id);
        
        // Update fields while preserving certain values
        existingEntry.setTargetType(entry.getTargetType());
        existingEntry.setTargetValue(entry.getTargetValue());
        existingEntry.setCategory(entry.getCategory());
        existingEntry.setRiskLevel(entry.getRiskLevel());
        existingEntry.setReason(entry.getReason());
        existingEntry.setExpiryDate(entry.getExpiryDate());
        existingEntry.setAssociatedEmail(entry.getAssociatedEmail());
        existingEntry.setDeviceFingerprint(entry.getDeviceFingerprint());
        
        return blacklistRepository.save(existingEntry);
    }

    @Override
    public BlacklistEntry getEntry(String id) {
        return blacklistRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Blacklist entry not found: " + id));
    }

    @Override
    @Transactional
    public void deleteEntry(String id) {
        blacklistRepository.deleteById(id);
    }

    @Override
    public Page<BlacklistEntry> getEntries(String search, String category, String status,
                                         String riskLevel, Pageable pageable) {
        BlacklistEntry.Category categoryEnum = category != null ? 
            BlacklistEntry.Category.valueOf(category.toUpperCase()) : null;
        BlacklistEntry.Status statusEnum = status != null ? 
            BlacklistEntry.Status.valueOf(status.toUpperCase()) : null;
        BlacklistEntry.RiskLevel riskLevelEnum = riskLevel != null ? 
            BlacklistEntry.RiskLevel.valueOf(riskLevel.toUpperCase()) : null;

        List<BlacklistEntry> filtered = blacklistRepository.findWithFilters(
            search, categoryEnum, statusEnum, riskLevelEnum);
        
        // Handle empty list case
        if (filtered.isEmpty()) {
            return new org.springframework.data.domain.PageImpl<>(
                List.of(), pageable, 0);
        }
        
        int start = (int) pageable.getOffset();
        // Ensure start index is within bounds
        start = Math.min(start, filtered.size());
        
        // Calculate end index ensuring it doesn't exceed list size
        int end = Math.min((start + pageable.getPageSize()), filtered.size());
        
        // If start equals end (at the end of the list), return empty page
        if (start == end) {
            return new org.springframework.data.domain.PageImpl<>(
                List.of(), pageable, filtered.size());
        }
        
        return new org.springframework.data.domain.PageImpl<>(
            filtered.subList(start, end), pageable, filtered.size());
    }

    @Override
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        LocalDateTime weekAgo = LocalDateTime.now().minusWeeks(1);
        
        // Auto-update expired blacklist entries
        updateExpiredBlacklistEntries();
        
        stats.put("totalActive", blacklistRepository.countActiveEntries());
        stats.put("newThisWeek", blacklistRepository.countEntriesAddedAfter(weekAgo));
        stats.put("fraudPrevented", blacklistRepository.getTotalIncidents());
        // Remove estimatedSavings calculation - too complex for current project
        stats.put("pendingAppeals", blacklistRepository.countPendingAppeals());
        stats.put("avgAppealTime", 24); // Mock value for now
        
        return stats;
    }

    // Method to automatically update expired blacklist entries
    @Transactional
    public void updateExpiredBlacklistEntries() {
        LocalDateTime now = LocalDateTime.now();
        List<BlacklistEntry> expiredEntries = blacklistRepository.findActiveEntriesWithExpiryBefore(now);
        
        for (BlacklistEntry entry : expiredEntries) {
            entry.setStatus(BlacklistEntry.Status.LIFTED);
            blacklistRepository.save(entry);
        }
        
        if (!expiredEntries.isEmpty()) {
            System.out.println("Auto-updated " + expiredEntries.size() + " expired blacklist entries to LIFTED status");
        }
    }

    @Override
    @Transactional
    public BlacklistEntry liftBan(String id) {
        BlacklistEntry entry = getEntry(id);
        entry.setStatus(BlacklistEntry.Status.LIFTED);
        return blacklistRepository.save(entry);
    }

    @Override
    @Transactional
    public void bulkLiftBan(List<String> ids) {
        ids.forEach(this::liftBan);
    }

    @Override
    @Transactional
    public BlacklistEntry addNote(String id, String note) {
        BlacklistEntry entry = getEntry(id);
        String currentNotes = entry.getNotes();
        String timestamp = LocalDateTime.now().toString();
        
        String newNote = String.format("[%s] %s", timestamp, note);
        if (currentNotes != null && !currentNotes.isEmpty()) {
            entry.setNotes(currentNotes + "\n\n" + newNote);
        } else {
            entry.setNotes(newNote);
        }
        
        return blacklistRepository.save(entry);
    }

    @Override
    @Transactional
    public BlacklistEntry extendBan(String id, LocalDateTime newExpiryDate) {
        BlacklistEntry entry = getEntry(id);
        entry.setExpiryDate(newExpiryDate);
        return blacklistRepository.save(entry);
    }

    @Override
    @Transactional
    public void bulkExtendBan(List<String> ids, LocalDateTime newExpiryDate) {
        ids.forEach(id -> extendBan(id, newExpiryDate));
    }

    @Override
    @Transactional
    public void bulkUpdateCategory(List<String> ids, String category) {
        BlacklistEntry.Category categoryEnum = BlacklistEntry.Category.valueOf(category.toUpperCase());
        ids.forEach(id -> {
            BlacklistEntry entry = getEntry(id);
            entry.setCategory(categoryEnum);
            blacklistRepository.save(entry);
        });
    }

    @Override
    public byte[] exportEntries(String search, String category, String status, String riskLevel) {
        BlacklistEntry.Category categoryEnum = category != null ? 
            BlacklistEntry.Category.valueOf(category.toUpperCase()) : null;
        BlacklistEntry.Status statusEnum = status != null ? 
            BlacklistEntry.Status.valueOf(status.toUpperCase()) : null;
        BlacklistEntry.RiskLevel riskLevelEnum = riskLevel != null ? 
            BlacklistEntry.RiskLevel.valueOf(riskLevel.toUpperCase()) : null;

        List<BlacklistEntry> entries = blacklistRepository.findWithFilters(
            search, categoryEnum, statusEnum, riskLevelEnum);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             CSVPrinter csvPrinter = new CSVPrinter(new PrintWriter(out), CSVFormat.DEFAULT)) {
            
            // Write headers
            csvPrinter.printRecord(
                "Target Type", "Target Value", "Category", "Risk Level", "Reason",
                "Status", "Added Date", "Added By", "Incident Count",
                "Associated Email", "Notes"
            );

            // Write data
            for (BlacklistEntry entry : entries) {
                csvPrinter.printRecord(
                    entry.getTargetType(),
                    entry.getTargetValue(),
                    entry.getCategory(),
                    entry.getRiskLevel(),
                    entry.getReason(),
                    entry.getStatus(),
                    entry.getAddedDate(),
                    entry.getAddedBy(),
                    entry.getIncidentCount(),
                    entry.getAssociatedEmail(),
                    entry.getNotes()
                );
            }

            csvPrinter.flush();
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to export blacklist entries", e);
        }
    }

    @Override
    public List<Map<String, Object>> getIncidentHistory(String id) {
        // Mock implementation - replace with actual incident history tracking
        BlacklistEntry entry = getEntry(id);
        List<Map<String, Object>> history = new ArrayList<>();
        
        // Generate some mock history entries
        for (int i = 0; i < entry.getIncidentCount(); i++) {
            Map<String, Object> incident = new HashMap<>();
            incident.put("date", entry.getAddedDate().plusDays(i));
            incident.put("type", "Attempted Access");
            incident.put("details", "Blocked access attempt from " + entry.getTargetValue());
            history.add(incident);
        }
        
        return history;
    }

    @Override
    public Map<String, Boolean> getAutoRules() {
        if (autoRules.isEmpty()) {
            // Initialize default rules
            autoRules.put("failedPayments", true);
            autoRules.put("chargebacks", true);
            autoRules.put("suspiciousActivity", false);
            autoRules.put("multipleAccounts", false);
            autoRules.put("vpnDetection", false);
        }
        return new HashMap<>(autoRules);
    }

    @Override
    public Map<String, Boolean> updateAutoRules(Map<String, Boolean> rules) {
        autoRules.putAll(rules);
        return new HashMap<>(autoRules);
    }

    // Method to get active blacklist entry by email
    public BlacklistEntry getActiveBlacklistByEmail(String email) {
        try {
            return blacklistRepository.findActiveByTargetTypeAndTargetValue(
                BlacklistEntry.TargetType.EMAIL, 
                email.toLowerCase()
            );
        } catch (Exception e) {
            // If no entry found or any other error, return null
            return null;
        }
    }

    // Method to get blacklist entry by email and status
    @Override
    public BlacklistEntry getBlacklistByEmailAndStatus(String email, BlacklistEntry.Status status) {
        try {
            return blacklistRepository.findByTargetTypeAndTargetValueAndStatus(
                BlacklistEntry.TargetType.EMAIL, 
                email.toLowerCase(),
                status
            );
        } catch (Exception e) {
            // If no entry found or any other error, return null
            return null;
        }
    }

    @Override
    public List<Map<String, Object>> findRelatedAccounts(String targetType, String targetValue) {
        List<Map<String, Object>> relatedAccounts = new ArrayList<>();
        
        try {
            if ("EMAIL".equalsIgnoreCase(targetType)) {
                // Find accounts that used the most frequently used IP of the blacklisted email
                List<String> relatedUsernames = loginAttemptRepository.findRelatedUsernames(targetValue);
                
                for (String username : relatedUsernames) {
                    Map<String, Object> account = new HashMap<>();
                    account.put("email", username);
                    account.put("similarity", "Used most frequently used IP of blacklisted account");
                    account.put("source", "login_attempts");
                    relatedAccounts.add(account);
                }
                
            } else if ("IP".equalsIgnoreCase(targetType)) {
                // For IP type, we can't use the same logic, so return empty for now
                // Or implement a different logic if needed
                System.out.println("IP-based related accounts not implemented yet");
            }
        } catch (Exception e) {
            // Log error and return empty list
            System.err.println("Error finding related accounts: " + e.getMessage());
        }
        
        return relatedAccounts;
    }
} 