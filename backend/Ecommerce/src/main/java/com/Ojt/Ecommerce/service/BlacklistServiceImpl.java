package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.BlacklistEntry;
import com.Ojt.Ecommerce.entity.LoginAttempt;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.entity.Appeal;
import com.Ojt.Ecommerce.repository.BlacklistRepository;
import com.Ojt.Ecommerce.repository.LoginAttemptRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.repository.AppealRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final AppealRepository appealRepository;
    private final Map<String, Boolean> autoRules = new HashMap<>();

    @Override
    @Transactional
    public BlacklistEntry addEntry(BlacklistEntry entry) {
        entry.setAddedDate(LocalDateTime.now());
        entry.setStatus(BlacklistEntry.Status.ACTIVE);
        entry.setLastIncidentDate(LocalDateTime.now());
        entry.setIncidentCount(1);
        
        // Set addedBy to current authenticated user's name or "System" if no user
        String currentUserName = getCurrentUserName();
        entry.setAddedBy(currentUserName != null ? currentUserName : "System");
        
        BlacklistEntry savedEntry = blacklistRepository.save(entry);
        
        // Send email notification if target type is EMAIL
        if (entry.getTargetType() == BlacklistEntry.TargetType.EMAIL) {
            sendBanNotification(entry);
        }
        
        return savedEntry;
    }

    /**
     * Get the current authenticated user's name
     */
    private String getCurrentUserName() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && 
                !"anonymousUser".equals(authentication.getName())) {
                
                // Get user email from authentication
                String userEmail = authentication.getName();
                
                // Find user by email to get their name
                Optional<User> user = userRepository.findByEmail(userEmail);
                if (user.isPresent()) {
                    return user.get().getName();
                }
            }
        } catch (Exception e) {
            System.err.println("Error getting current user name: " + e.getMessage());
        }
        return null;
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
        
        // Apply sorting if specified
        if (pageable.getSort().isSorted()) {
            Sort.Order order = pageable.getSort().iterator().next();
            String sortField = order.getProperty();
            boolean ascending = order.getDirection() == Sort.Direction.ASC;
            
            filtered.sort((a, b) -> {
                int result = 0;
                switch (sortField) {
                    case "addedDate":
                        result = a.getAddedDate().compareTo(b.getAddedDate());
                        break;
                    case "targetValue":
                        result = a.getTargetValue().compareToIgnoreCase(b.getTargetValue());
                        break;
                    case "category":
                        result = a.getCategory().compareTo(b.getCategory());
                        break;
                    case "status":
                        result = a.getStatus().compareTo(b.getStatus());
                        break;
                    case "riskLevel":
                        result = a.getRiskLevel().compareTo(b.getRiskLevel());
                        break;
                    case "incidentCount":
                        result = Integer.compare(a.getIncidentCount(), b.getIncidentCount());
                        break;
                    default:
                        result = a.getAddedDate().compareTo(b.getAddedDate()); // Default sort by addedDate
                        break;
                }
                return ascending ? result : -result;
            });
        } else {
            // Default sort by addedDate descending (newest first)
            filtered.sort((a, b) -> b.getAddedDate().compareTo(a.getAddedDate()));
        }
        
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
        stats.put("pendingAppeals", blacklistRepository.countPendingAppeals());
        
        // Calculate average appeal response time dynamically
        double avgAppealTime = calculateAverageAppealTime();
        stats.put("avgAppealTime", avgAppealTime);
        
        // Calculate trend indicators
        Map<String, Object> trends = calculateTrends();
        stats.put("trends", trends);
        
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
        BlacklistEntry savedEntry = blacklistRepository.save(entry);
        
        // Send email notification if target type is EMAIL
        if (entry.getTargetType() == BlacklistEntry.TargetType.EMAIL) {
            sendBanLiftedNotification(entry);
        }
        
        return savedEntry;
    }

    @Override
    @Transactional
    public void bulkLiftBan(List<String> ids) {
        for (String id : ids) {
            BlacklistEntry entry = getEntry(id);
            entry.setStatus(BlacklistEntry.Status.LIFTED);
            blacklistRepository.save(entry);
            
            // Send email notification if target type is EMAIL
            if (entry.getTargetType() == BlacklistEntry.TargetType.EMAIL) {
                sendBanLiftedNotification(entry);
            }
        }
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
        LocalDateTime oldExpiryDate = entry.getExpiryDate();
        entry.setExpiryDate(newExpiryDate);
        BlacklistEntry savedEntry = blacklistRepository.save(entry);
        
        // Send email notification if target type is EMAIL
        if (entry.getTargetType() == BlacklistEntry.TargetType.EMAIL) {
            sendBanExtendedNotification(entry, oldExpiryDate);
        }
        
        return savedEntry;
    }

    @Override
    @Transactional
    public void bulkExtendBan(List<String> ids, LocalDateTime newExpiryDate) {
        for (String id : ids) {
            BlacklistEntry entry = getEntry(id);
            LocalDateTime oldExpiryDate = entry.getExpiryDate();
            entry.setExpiryDate(newExpiryDate);
            blacklistRepository.save(entry);
            
            // Send email notification if target type is EMAIL
            if (entry.getTargetType() == BlacklistEntry.TargetType.EMAIL) {
                sendBanExtendedNotification(entry, oldExpiryDate);
            }
        }
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

    // Method to get active blacklist entry by IP
    public BlacklistEntry getActiveBlacklistByIp(String ip) {
        try {
            return blacklistRepository.findActiveByTargetTypeAndTargetValue(
                BlacklistEntry.TargetType.IP, 
                ip
            );
        } catch (Exception e) {
            // If no entry found or any other error, return null
            return null;
        }
    }

    // Method to get active blacklist entry by phone
    public BlacklistEntry getActiveBlacklistByPhone(String phone) {
        try {
            if (phone == null || phone.trim().isEmpty()) {
                System.out.println("[BlacklistService] Phone number is null or empty");
                return null;
            }
            
            // Clean and normalize the phone number
            String normalizedPhone = phone.trim();
            System.out.println("[BlacklistService] Checking phone number: " + normalizedPhone);
            
            // First try exact match
            BlacklistEntry entry = blacklistRepository.findActiveByTargetTypeAndTargetValue(
                BlacklistEntry.TargetType.PHONE, 
                normalizedPhone
            );
            
            if (entry != null) {
                System.out.println("[BlacklistService] Found exact match for phone: " + normalizedPhone);
                return entry;
            }
            
            // Try without + prefix
            if (normalizedPhone.startsWith("+")) {
                String withoutPlus = normalizedPhone.substring(1);
                System.out.println("[BlacklistService] Trying without + prefix: " + withoutPlus);
                entry = blacklistRepository.findActiveByTargetTypeAndTargetValue(
                    BlacklistEntry.TargetType.PHONE, 
                    withoutPlus
                );
                if (entry != null) {
                    System.out.println("[BlacklistService] Found match without + prefix for phone: " + withoutPlus);
                    return entry;
                }
            }
            
            // Try with + prefix
            if (!normalizedPhone.startsWith("+")) {
                String withPlus = "+" + normalizedPhone;
                System.out.println("[BlacklistService] Trying with + prefix: " + withPlus);
                entry = blacklistRepository.findActiveByTargetTypeAndTargetValue(
                    BlacklistEntry.TargetType.PHONE, 
                    withPlus
                );
                if (entry != null) {
                    System.out.println("[BlacklistService] Found match with + prefix for phone: " + withPlus);
                    return entry;
                }
            }
            
            System.out.println("[BlacklistService] No blacklist entry found for phone: " + normalizedPhone);
            return null;
            
        } catch (Exception e) {
            System.err.println("[BlacklistService] Error checking phone blacklist: " + e.getMessage());
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

    // Method to send email notification for new blacklist entries
    private void sendBanNotification(BlacklistEntry entry) {
        String email = entry.getTargetValue(); // Use target value for EMAIL type
        if (entry.getTargetType() == BlacklistEntry.TargetType.EMAIL && email != null && !email.isEmpty()) {
            String subject = "Account Security Alert - Your Account Has Been Restricted";
            String banType = entry.getExpiryDate() == null ? "Permanent" : "Temporary";
            String expiryInfo = entry.getExpiryDate() == null ? 
                "This restriction is permanent." : 
                "This restriction will expire on: " + entry.getExpiryDate().toString();
            
            String message = String.format(
                "Dear User,\n\n" +
                "Your account has been restricted due to security concerns.\n\n" +
                "Details:\n" +
                "- Email: %s\n" +
                "- Restriction Type: %s\n" +
                "- Category: %s\n" +
                "- Risk Level: %s\n" +
                "- Reason: %s\n" +
                "- %s\n\n" +
                "If you believe this restriction was applied in error, you may submit an appeal through our support system.\n\n" +
                "Best regards,\nSecurity Team",
                email,
                banType,
                entry.getCategory(),
                entry.getRiskLevel(),
                entry.getReason(),
                expiryInfo
            );
            
            try {
                emailService.sendEmail(email, subject, message);
                System.out.println("Ban notification email sent to: " + email);
            } catch (Exception e) {
                System.err.println("Failed to send ban notification email to " + email + ": " + e.getMessage());
            }
        }
    }

    // Method to send email notification when a ban is lifted
    private void sendBanLiftedNotification(BlacklistEntry entry) {
        String email = entry.getTargetValue(); // Use target value for EMAIL type
        if (entry.getTargetType() == BlacklistEntry.TargetType.EMAIL && email != null && !email.isEmpty()) {
            String subject = "Account Security Alert - Your Account Restriction Has Been Lifted";
            String message = String.format(
                "Dear User,\n\n" +
                "Your account restriction has been lifted. You are now free to use our services.\n\n" +
                "Details:\n" +
                "- Email: %s\n" +
                "- Restriction Type: %s\n" +
                "- Category: %s\n" +
                "- Risk Level: %s\n" +
                "- Reason: %s\n" +
                "- %s\n\n" +
                "Best regards,\nSecurity Team",
                email,
                entry.getTargetType() == BlacklistEntry.TargetType.EMAIL ? "Email" : "IP",
                entry.getCategory(),
                entry.getRiskLevel(),
                entry.getReason(),
                entry.getExpiryDate() == null ? "This restriction is permanent." : "This restriction will expire on: " + entry.getExpiryDate().toString()
            );

            try {
                emailService.sendEmail(email, subject, message);
                System.out.println("Ban lifted notification email sent to: " + email);
            } catch (Exception e) {
                System.err.println("Failed to send ban lifted notification email to " + email + ": " + e.getMessage());
            }
        }
    }

    // Method to send email notification when a ban is extended
    private void sendBanExtendedNotification(BlacklistEntry entry, LocalDateTime oldExpiryDate) {
        String email = entry.getTargetValue(); // Use target value for EMAIL type
        if (entry.getTargetType() == BlacklistEntry.TargetType.EMAIL && email != null && !email.isEmpty()) {
            String subject = "Account Security Alert - Your Account Ban Has Been Extended";
            String banType = entry.getExpiryDate() == null ? "Permanent" : "Temporary";
            String oldExpiryInfo = oldExpiryDate == null ? "This restriction is permanent." : "This restriction was set to expire on: " + oldExpiryDate.toString();
            String newExpiryInfo = entry.getExpiryDate() == null ? "This restriction is permanent." : "This restriction will expire on: " + entry.getExpiryDate().toString();
            
            String message = String.format(
                "Dear User,\n\n" +
                "Your account ban has been extended.\n\n" +
                "Details:\n" +
                "- Email: %s\n" +
                "- Restriction Type: %s\n" +
                "- Category: %s\n" +
                "- Risk Level: %s\n" +
                "- Reason: %s\n" +
                "- %s\n" +
                "- %s\n\n" +
                "Best regards,\nSecurity Team",
                email,
                entry.getTargetType() == BlacklistEntry.TargetType.EMAIL ? "Email" : "IP",
                entry.getCategory(),
                entry.getRiskLevel(),
                entry.getReason(),
                oldExpiryInfo,
                newExpiryInfo
            );

            try {
                emailService.sendEmail(email, subject, message);
                System.out.println("Ban extended notification email sent to: " + email);
            } catch (Exception e) {
                System.err.println("Failed to send ban extended notification email to " + email + ": " + e.getMessage());
            }
        }
    }
    
    // Calculate average appeal response time dynamically
    private double calculateAverageAppealTime() {
        try {
            // Get all appeals that have been reviewed (approved or rejected)
            List<Appeal> reviewedAppeals = appealRepository.findByStatusIn(
                Arrays.asList(Appeal.AppealStatus.APPROVED, Appeal.AppealStatus.REJECTED)
            );
            
            if (reviewedAppeals.isEmpty()) {
                return 24.0; // Default value if no appeals have been reviewed
            }
            
            long totalHours = 0;
            int validAppeals = 0;
            
            for (Appeal appeal : reviewedAppeals) {
                if (appeal.getSubmittedAt() != null && appeal.getReviewedAt() != null) {
                    long hours = java.time.Duration.between(appeal.getSubmittedAt(), appeal.getReviewedAt()).toHours();
                    totalHours += hours;
                    validAppeals++;
                }
            }
            
            if (validAppeals == 0) {
                return 24.0; // Default value if no valid appeals
            }
            
            return Math.round((double) totalHours / validAppeals * 10.0) / 10.0; // Round to 1 decimal place
        } catch (Exception e) {
            System.err.println("Error calculating average appeal time: " + e.getMessage());
            return 24.0; // Default value on error
        }
    }
    
    // Calculate trend indicators
    private Map<String, Object> calculateTrends() {
        Map<String, Object> trends = new HashMap<>();
        
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime lastMonth = now.minusMonths(1);
            LocalDateTime twoMonthsAgo = now.minusMonths(2);
            
            // Calculate fraud attempts trend
            long currentMonthFraud = blacklistRepository.countEntriesAddedAfter(lastMonth);
            long previousMonthFraud = blacklistRepository.countEntriesAddedBetween(twoMonthsAgo, lastMonth);
            
            double fraudTrend = 0.0;
            if (previousMonthFraud == 0 && currentMonthFraud > 0) {
                fraudTrend = 100.0; // +100% when going from 0 to any positive number
            } else if (previousMonthFraud > 0) {
                fraudTrend = ((double) (currentMonthFraud - previousMonthFraud) / previousMonthFraud) * 100;
            } else if (previousMonthFraud == 0 && currentMonthFraud == 0) {
                fraudTrend = 0.0; // No change when both are 0
            }
            
            trends.put("fraudTrend", Math.round(fraudTrend * 10.0) / 10.0); // Round to 1 decimal place
            trends.put("fraudTrendDirection", fraudTrend > 0 ? "up" : fraudTrend < 0 ? "down" : "stable");
            
            // Calculate blacklist entries trend
            long currentMonthEntries = blacklistRepository.countEntriesAddedAfter(lastMonth);
            long previousMonthEntries = blacklistRepository.countEntriesAddedBetween(twoMonthsAgo, lastMonth);
            
            double entriesTrend = 0.0;
            if (previousMonthEntries == 0 && currentMonthEntries > 0) {
                entriesTrend = 100.0; // +100% when going from 0 to any positive number
            } else if (previousMonthEntries > 0) {
                entriesTrend = ((double) (currentMonthEntries - previousMonthEntries) / previousMonthEntries) * 100;
            } else if (previousMonthEntries == 0 && currentMonthEntries == 0) {
                entriesTrend = 0.0; // No change when both are 0
            }
            
            trends.put("entriesTrend", Math.round(entriesTrend * 10.0) / 10.0);
            trends.put("entriesTrendDirection", entriesTrend > 0 ? "up" : entriesTrend < 0 ? "down" : "stable");
            
        } catch (Exception e) {
            System.err.println("Error calculating trends: " + e.getMessage());
            trends.put("fraudTrend", 0.0);
            trends.put("fraudTrendDirection", "stable");
            trends.put("entriesTrend", 0.0);
            trends.put("entriesTrendDirection", "stable");
        }
        
        return trends;
    }
} 