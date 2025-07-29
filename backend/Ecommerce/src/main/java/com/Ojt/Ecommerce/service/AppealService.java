package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Appeal;
import com.Ojt.Ecommerce.entity.BlacklistEntry;
import com.Ojt.Ecommerce.repository.AppealRepository;
import com.Ojt.Ecommerce.repository.BlacklistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AppealService {

    private final AppealRepository appealRepository;
    private final BlacklistRepository blacklistRepository;

    @Transactional
    public Appeal submitAppeal(Map<String, Object> appealData) {
        Appeal appeal = new Appeal();
        
        // Generate manual ID
        appeal.setId("APPEAL_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 1000));
        
        // Set appeal data
        String userEmail = (String) appealData.get("contactEmail");
        appeal.setUserEmail(userEmail);
        appeal.setAppealReason(Appeal.AppealReason.valueOf((String) appealData.get("appealReason")));
        appeal.setAppealDetails((String) appealData.get("appealDetails"));
        appeal.setContactEmail(userEmail);
        appeal.setSubmittedAt(LocalDateTime.now());
        appeal.setStatus(Appeal.AppealStatus.PENDING);

        // Find the blacklist entry for this user
        try {
            BlacklistEntry blacklistEntry = blacklistRepository.findActiveByTargetTypeAndTargetValue(
                BlacklistEntry.TargetType.EMAIL,
                userEmail.toLowerCase()
            );
            
            if (blacklistEntry != null) {
                appeal.setBlacklistEntryId(blacklistEntry.getId());
                
                // Update blacklist entry status to APPEALED
                blacklistEntry.setStatus(BlacklistEntry.Status.APPEALED);
                blacklistRepository.save(blacklistEntry);
                System.out.println("Found blacklist entry and updated status to APPEALED: " + blacklistEntry.getId());
            } else {
                // If no blacklist entry found, still allow appeal submission
                // This handles cases where user might be blocked by other means
                appeal.setBlacklistEntryId(null);
                System.out.println("No active blacklist entry found for user: " + userEmail + ". Appeal will be submitted without blacklist entry ID.");
            }
        } catch (Exception e) {
            // Log error but still allow appeal submission
            System.err.println("Error finding blacklist entry for user " + userEmail + ": " + e.getMessage());
            appeal.setBlacklistEntryId(null);
        }

        // Save the appeal
        Appeal savedAppeal = appealRepository.save(appeal);
        System.out.println("Appeal saved successfully with ID: " + savedAppeal.getId());
        return savedAppeal;
    }

    public List<Appeal> getAllAppeals() {
        return appealRepository.findAll();
    }

    public List<Appeal> getPendingAppeals() {
        return appealRepository.findByStatusOrderBySubmittedAtDesc(Appeal.AppealStatus.PENDING);
    }

    public Appeal getAppealById(String id) {
        return appealRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Appeal not found"));
    }

    @Transactional
    public Appeal reviewAppeal(String id, Map<String, Object> reviewData) {
        Appeal appeal = getAppealById(id);
        
        String decision = (String) reviewData.get("decision");
        String adminNotes = (String) reviewData.get("adminNotes");
        
        System.out.println("Reviewing appeal ID: " + id);
        System.out.println("Decision: " + decision);
        System.out.println("Admin notes: " + adminNotes);
        System.out.println("Current appeal status: " + appeal.getStatus());
        
        if ("APPROVE".equalsIgnoreCase(decision)) {
            appeal.setStatus(Appeal.AppealStatus.APPROVED);
            System.out.println("Setting appeal status to APPROVED");
            
            // Lift the ban
            if (appeal.getBlacklistEntryId() != null) {
                BlacklistEntry blacklistEntry = blacklistRepository.findById(appeal.getBlacklistEntryId())
                    .orElse(null);
                if (blacklistEntry != null) {
                    blacklistEntry.setStatus(BlacklistEntry.Status.LIFTED);
                    blacklistRepository.save(blacklistEntry);
                    System.out.println("Lifted ban for blacklist entry: " + blacklistEntry.getId());
                }
            }
        } else if ("REJECT".equalsIgnoreCase(decision)) {
            appeal.setStatus(Appeal.AppealStatus.REJECTED);
            System.out.println("Setting appeal status to REJECTED");
            
            // Reactivate the ban
            if (appeal.getBlacklistEntryId() != null) {
                BlacklistEntry blacklistEntry = blacklistRepository.findById(appeal.getBlacklistEntryId())
                    .orElse(null);
                if (blacklistEntry != null) {
                    blacklistEntry.setStatus(BlacklistEntry.Status.ACTIVE);
                    blacklistRepository.save(blacklistEntry);
                    System.out.println("Reactivated ban for blacklist entry: " + blacklistEntry.getId());
                }
            }
        }
        
        appeal.setAdminNotes(adminNotes);
        appeal.setReviewedAt(LocalDateTime.now());
        appeal.setReviewedBy("Admin"); // TODO: Get actual admin user
        
        Appeal savedAppeal = appealRepository.save(appeal);
        System.out.println("Saved appeal with status: " + savedAppeal.getStatus());
        
        return savedAppeal;
    }

    public Map<String, Object> getAppealStats() {
        Map<String, Object> stats = new HashMap<>();
        
        long pendingCount = appealRepository.countByStatus(Appeal.AppealStatus.PENDING);
        long approvedCount = appealRepository.countByStatus(Appeal.AppealStatus.APPROVED);
        long rejectedCount = appealRepository.countByStatus(Appeal.AppealStatus.REJECTED);
        
        stats.put("pendingAppeals", pendingCount);
        stats.put("approvedAppeals", approvedCount);
        stats.put("rejectedAppeals", rejectedCount);
        stats.put("totalAppeals", pendingCount + approvedCount + rejectedCount);
        
        return stats;
    }
}