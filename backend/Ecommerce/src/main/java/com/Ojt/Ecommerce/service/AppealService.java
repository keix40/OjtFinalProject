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
    private final EmailService emailService;

    @Transactional
    public Appeal submitAppeal(Map<String, Object> appealData) {
        System.out.println("=== SUBMITTING APPEAL ===");
        System.out.println("Appeal data received: " + appealData);
        
        Appeal appeal = new Appeal();
        
        // Generate manual ID
        appeal.setId("APPEAL_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 1000));
        System.out.println("Generated appeal ID: " + appeal.getId());
        
        // Set appeal data
        String userEmail = (String) appealData.get("contactEmail");
        System.out.println("User email from appeal: " + userEmail);
        
        appeal.setUserEmail(userEmail);
        appeal.setAppealReason(Appeal.AppealReason.valueOf((String) appealData.get("appealReason")));
        appeal.setAppealDetails((String) appealData.get("appealDetails"));
        appeal.setContactEmail(userEmail);
        appeal.setSubmittedAt(LocalDateTime.now());
        appeal.setStatus(Appeal.AppealStatus.PENDING);

        // Find the blacklist entry for this user - improved lookup logic
        System.out.println("Starting blacklist entry lookup for email: " + userEmail);
        try {
            BlacklistEntry blacklistEntry = findBlacklistEntryByEmail(userEmail);
            
            if (blacklistEntry != null) {
                System.out.println("SUCCESS: Found blacklist entry with ID: " + blacklistEntry.getId());
                System.out.println("Blacklist entry details:");
                System.out.println("  - Target Type: " + blacklistEntry.getTargetType());
                System.out.println("  - Target Value: " + blacklistEntry.getTargetValue());
                System.out.println("  - Associated Email: " + blacklistEntry.getAssociatedEmail());
                System.out.println("  - Current Status: " + blacklistEntry.getStatus());
                
                appeal.setBlacklistEntryId(blacklistEntry.getId());
                
                // Update blacklist entry status to APPEALED
                blacklistEntry.setStatus(BlacklistEntry.Status.APPEALED);
                BlacklistEntry savedEntry = blacklistRepository.save(blacklistEntry);
                System.out.println("Updated blacklist entry status to APPEALED: " + savedEntry.getId());
                System.out.println("New blacklist status: " + savedEntry.getStatus());
            } else {
                // If no blacklist entry found, still allow appeal submission
                // This handles cases where user might be blocked by other means
                appeal.setBlacklistEntryId(null);
                System.out.println("WARNING: No active blacklist entry found for user: " + userEmail);
                System.out.println("Appeal will be submitted without blacklist entry ID.");
            }
        } catch (Exception e) {
            // Log error but still allow appeal submission
            System.err.println("ERROR: Exception during blacklist entry lookup for user " + userEmail + ": " + e.getMessage());
            e.printStackTrace();
            appeal.setBlacklistEntryId(null);
        }

        // Save the appeal
        Appeal savedAppeal = appealRepository.save(appeal);
        System.out.println("Appeal saved successfully with ID: " + savedAppeal.getId());
        System.out.println("Final blacklistEntryId: " + savedAppeal.getBlacklistEntryId());
        System.out.println("=== END APPEAL SUBMISSION ===");
        
        // Send confirmation email to user
        sendAppealSubmittedNotification(savedAppeal);
        
        return savedAppeal;
    }

    /**
     * Find blacklist entry by email using multiple strategies
     */
    private BlacklistEntry findBlacklistEntryByEmail(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        System.out.println("Looking for blacklist entry with normalized email: " + normalizedEmail);
        
        // Strategy 1: Look for direct email target type
        System.out.println("Strategy 1: Looking for EMAIL target type...");
        BlacklistEntry entry = blacklistRepository.findActiveByTargetTypeAndTargetValue(
            BlacklistEntry.TargetType.EMAIL, normalizedEmail);
        if (entry != null) {
            System.out.println("SUCCESS: Found blacklist entry by direct email target: " + entry.getId());
            return entry;
        } else {
            System.out.println("No blacklist entry found with EMAIL target type");
        }
        
        // Strategy 2: Look for entries with this email as associatedEmail
        System.out.println("Strategy 2: Looking for associated email...");
        List<BlacklistEntry> entriesWithAssociatedEmail = blacklistRepository.findByAssociatedEmailAndStatus(
            normalizedEmail, BlacklistEntry.Status.ACTIVE);
        if (!entriesWithAssociatedEmail.isEmpty()) {
            BlacklistEntry foundEntry = entriesWithAssociatedEmail.get(0);
            System.out.println("SUCCESS: Found blacklist entry by associated email: " + foundEntry.getId());
            return foundEntry;
        } else {
            System.out.println("No blacklist entry found with this associated email");
        }
        
        // Strategy 3: Look for entries with case-insensitive email match
        System.out.println("Strategy 3: Looking for case-insensitive matches in all active entries...");
        List<BlacklistEntry> allActiveEntries = blacklistRepository.findByStatus(BlacklistEntry.Status.ACTIVE);
        System.out.println("Total active blacklist entries found: " + allActiveEntries.size());
        
        for (BlacklistEntry entry2 : allActiveEntries) {
            System.out.println("Checking entry: " + entry2.getId());
            System.out.println("  - Target Type: " + entry2.getTargetType());
            System.out.println("  - Target Value: " + entry2.getTargetValue());
            System.out.println("  - Associated Email: " + entry2.getAssociatedEmail());
            
            // Check target value (case-insensitive)
            if (entry2.getTargetValue() != null && 
                entry2.getTargetValue().toLowerCase().trim().equals(normalizedEmail)) {
                System.out.println("SUCCESS: Found blacklist entry by case-insensitive target value: " + entry2.getId());
                return entry2;
            }
            
            // Check associated email (case-insensitive)
            if (entry2.getAssociatedEmail() != null && 
                entry2.getAssociatedEmail().toLowerCase().trim().equals(normalizedEmail)) {
                System.out.println("SUCCESS: Found blacklist entry by case-insensitive associated email: " + entry2.getId());
                return entry2;
            }
        }
        
        System.out.println("FAILED: No blacklist entry found for email: " + email);
        return null;
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
        
        System.out.println("=== REVIEWING APPEAL ===");
        System.out.println("Appeal ID: " + id);
        System.out.println("Decision: " + decision);
        System.out.println("Admin notes: " + adminNotes);
        System.out.println("Current appeal status: " + appeal.getStatus());
        System.out.println("Blacklist Entry ID: " + appeal.getBlacklistEntryId());
        System.out.println("User Email: " + appeal.getUserEmail());
        
        if ("APPROVE".equalsIgnoreCase(decision)) {
            appeal.setStatus(Appeal.AppealStatus.APPROVED);
            System.out.println("Setting appeal status to APPROVED");
            
            // Lift the ban
            if (appeal.getBlacklistEntryId() != null) {
                System.out.println("Looking for blacklist entry with ID: " + appeal.getBlacklistEntryId());
                BlacklistEntry blacklistEntry = blacklistRepository.findById(appeal.getBlacklistEntryId())
                    .orElse(null);
                if (blacklistEntry != null) {
                    System.out.println("Found blacklist entry: " + blacklistEntry.getId());
                    System.out.println("Current blacklist status: " + blacklistEntry.getStatus());
                    System.out.println("Blacklist target: " + blacklistEntry.getTargetType() + " = " + blacklistEntry.getTargetValue());
                    
                    blacklistEntry.setStatus(BlacklistEntry.Status.LIFTED);
                    BlacklistEntry savedEntry = blacklistRepository.save(blacklistEntry);
                    System.out.println("Lifted ban for blacklist entry: " + savedEntry.getId());
                    System.out.println("New blacklist status: " + savedEntry.getStatus());
                } else {
                    System.out.println("ERROR: Blacklist entry not found with ID: " + appeal.getBlacklistEntryId());
                    
                    // Try to find by email as fallback
                    System.out.println("Trying to find blacklist entry by email: " + appeal.getUserEmail());
                    BlacklistEntry fallbackEntry = findBlacklistEntryByEmail(appeal.getUserEmail());
                    if (fallbackEntry != null) {
                        System.out.println("Found fallback blacklist entry: " + fallbackEntry.getId());
                        fallbackEntry.setStatus(BlacklistEntry.Status.LIFTED);
                        BlacklistEntry savedEntry = blacklistRepository.save(fallbackEntry);
                        System.out.println("Lifted ban for fallback blacklist entry: " + savedEntry.getId());
                    } else {
                        System.out.println("ERROR: No blacklist entry found by email either");
                    }
                }
            } else {
                System.out.println("ERROR: Appeal has no blacklistEntryId");
                
                // Try to find by email as fallback
                System.out.println("Trying to find blacklist entry by email: " + appeal.getUserEmail());
                BlacklistEntry fallbackEntry = findBlacklistEntryByEmail(appeal.getUserEmail());
                if (fallbackEntry != null) {
                    System.out.println("Found fallback blacklist entry: " + fallbackEntry.getId());
                    fallbackEntry.setStatus(BlacklistEntry.Status.LIFTED);
                    BlacklistEntry savedEntry = blacklistRepository.save(fallbackEntry);
                    System.out.println("Lifted ban for fallback blacklist entry: " + savedEntry.getId());
                } else {
                    System.out.println("ERROR: No blacklist entry found by email either");
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
        System.out.println("Final appeal status: " + savedAppeal.getStatus());
        System.out.println("=== END REVIEW ===");
        
        // Send email notification based on decision
        if ("APPROVE".equalsIgnoreCase(decision)) {
            sendAppealApprovedNotification(savedAppeal);
        } else if ("REJECT".equalsIgnoreCase(decision)) {
            sendAppealRejectedNotification(savedAppeal);
        }
        
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
    
    // Method to send email notification for approved appeals
    private void sendAppealApprovedNotification(Appeal appeal) {
        String email = appeal.getContactEmail();
        if (email != null && !email.isEmpty()) {
            String subject = "Appeal Approved - Your Account Restriction Has Been Lifted";
            String message = String.format(
                "Dear User,\n\n" +
                "Your appeal has been approved! Your account restriction has been lifted.\n\n" +
                "Appeal Details:\n" +
                "- Appeal ID: %s\n" +
                "- Appeal Reason: %s\n" +
                "- Appeal Details: %s\n" +
                "- Decision: APPROVED\n" +
                "- Reviewed At: %s\n" +
                "- Admin Notes: %s\n\n" +
                "You can now access our services normally. We apologize for any inconvenience caused.\n\n" +
                "Best regards,\nSupport Team",
                appeal.getId(),
                appeal.getAppealReason(),
                appeal.getAppealDetails(),
                appeal.getReviewedAt(),
                appeal.getAdminNotes() != null ? appeal.getAdminNotes() : "No additional notes"
            );
            
            try {
                emailService.sendEmail(email, subject, message);
                System.out.println("Appeal approved notification email sent to: " + email);
            } catch (Exception e) {
                System.err.println("Failed to send appeal approved notification email to " + email + ": " + e.getMessage());
            }
        }
    }
    
    // Method to send email notification for rejected appeals
    private void sendAppealRejectedNotification(Appeal appeal) {
        String email = appeal.getContactEmail();
        if (email != null && !email.isEmpty()) {
            String subject = "Appeal Decision - Your Appeal Has Been Reviewed";
            String message = String.format(
                "Dear User,\n\n" +
                "Your appeal has been reviewed and unfortunately, it has been rejected.\n\n" +
                "Appeal Details:\n" +
                "- Appeal ID: %s\n" +
                "- Appeal Reason: %s\n" +
                "- Appeal Details: %s\n" +
                "- Decision: REJECTED\n" +
                "- Reviewed At: %s\n" +
                "- Admin Notes: %s\n\n" +
                "Your account restriction remains in place. If you have additional information or believe this decision was made in error, please contact our support team.\n\n" +
                "Best regards,\nSupport Team",
                appeal.getId(),
                appeal.getAppealReason(),
                appeal.getAppealDetails(),
                appeal.getReviewedAt(),
                appeal.getAdminNotes() != null ? appeal.getAdminNotes() : "No additional notes"
            );
            
            try {
                emailService.sendEmail(email, subject, message);
                System.out.println("Appeal rejected notification email sent to: " + email);
            } catch (Exception e) {
                System.err.println("Failed to send appeal rejected notification email to " + email + ": " + e.getMessage());
            }
        }
    }

    // Method to send email notification for submitted appeals
    private void sendAppealSubmittedNotification(Appeal appeal) {
        String email = appeal.getContactEmail();
        if (email != null && !email.isEmpty()) {
            String subject = "Appeal Submitted Successfully";
            String message = String.format(
                "Dear User,\n\n" +
                "Your appeal has been submitted successfully. We have received your request to review your account restriction.\n\n" +
                "Appeal Details:\n" +
                "- Appeal ID: %s\n" +
                "- Appeal Reason: %s\n" +
                "- Appeal Details: %s\n" +
                "- Submitted At: %s\n" +
                "- Status: PENDING\n\n" +
                "Our support team will review your appeal and get back to you as soon as possible. You will receive an email notification once a decision has been made.\n\n" +
                "Thank you for your patience.\n\n" +
                "Best regards,\nSupport Team",
                appeal.getId(),
                appeal.getAppealReason(),
                appeal.getAppealDetails(),
                appeal.getSubmittedAt()
            );

            try {
                emailService.sendEmail(email, subject, message);
                System.out.println("Appeal submitted confirmation email sent to: " + email);
            } catch (Exception e) {
                System.err.println("Failed to send appeal submitted confirmation email to " + email + ": " + e.getMessage());
            }
        }
    }
}