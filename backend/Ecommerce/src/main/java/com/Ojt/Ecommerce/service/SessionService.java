package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.UserSession;
import com.Ojt.Ecommerce.repository.UserSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoField;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SessionService {
    
    @Autowired
    private UserSessionRepository userSessionRepository;
    
    private static final int SESSION_TIMEOUT_MINUTES = 30; // 30 minutes of inactivity
    
    /**
     * Start a new session for a user or resume existing session
     */
    @Transactional
    public UserSession startSession(Long userId, String sessionId, String userAgent, String ipAddress) {
        // Handle anonymous users
        Long sessionUserId = userId;
        if (userId == null || userId == 0) {
            sessionUserId = -1L; // Use -1 for anonymous users
        }
        
        System.out.println("Starting session - userId: " + sessionUserId + ", sessionId: " + sessionId);
        
        try {
            // First, check if this session already exists (regardless of end time)
            Optional<UserSession> existingSession = userSessionRepository.findBySessionId(sessionId);
            if (existingSession.isPresent()) {
                UserSession session = existingSession.get();
                System.out.println("Found existing session: " + session.getId() + ", endTime: " + session.getEndTime());
                
                // If session is active, just update last activity
                if (session.getEndTime() == null) {
                    session.setLastActivity(LocalDateTime.now());
                    System.out.println("Updating existing active session");
                    return userSessionRepository.save(session);
                } else {
                    // Session exists but is ended, delete it and create new one
                    System.out.println("Session exists but is ended, deleting old session and creating new one");
                    userSessionRepository.deleteBySessionId(sessionId);
                    // Force flush to ensure deletion is committed
                    userSessionRepository.flush();
                }
            }
            
            // Check if there's an active session for this user with a different sessionId
            List<UserSession> activeUserSessions = userSessionRepository.findByUserIdAndEndTimeIsNull(sessionUserId);
            for (UserSession activeSession : activeUserSessions) {
                System.out.println("Ending old session for user: " + activeSession.getSessionId());
                activeSession.endSession();
                userSessionRepository.save(activeSession);
            }
            
            // Create new session
            UserSession newSession = new UserSession(sessionUserId, sessionId, userAgent, ipAddress);
            System.out.println("Creating new session with ID: " + sessionId);
            return userSessionRepository.save(newSession);
            
        } catch (Exception e) {
            System.err.println("Error in startSession: " + e.getMessage());
            e.printStackTrace();
            
            // If it's a constraint violation, try to force delete and retry
            if (e.getMessage().contains("constraint") || e.getMessage().contains("UKbjoac5vd2jt3pnrfrdeb49014")) {
                System.out.println("Constraint violation detected, attempting to force cleanup...");
                try {
                    // Force delete any existing session with this ID
                    userSessionRepository.deleteBySessionId(sessionId);
                    userSessionRepository.flush();
                    
                    // Create new session
                    UserSession newSession = new UserSession(sessionUserId, sessionId, userAgent, ipAddress);
                    return userSessionRepository.save(newSession);
                } catch (Exception retryException) {
                    System.err.println("Retry failed: " + retryException.getMessage());
                    throw new RuntimeException("Failed to start session after retry: " + retryException.getMessage());
                }
            }
            
            throw new RuntimeException("Failed to start session: " + e.getMessage());
        }
    }
    
    /**
     * Record a page view for an existing session
     */
    @Transactional
    public void recordPageView(String sessionId) {
        Optional<UserSession> sessionOpt = userSessionRepository.findBySessionIdAndEndTimeIsNull(sessionId);
        if (sessionOpt.isPresent()) {
            UserSession session = sessionOpt.get();
            session.incrementPageCount();
            userSessionRepository.save(session);
        } else {
            // If session doesn't exist, log it but don't create a new one
            // This could happen if the session was ended but frontend still tries to record page view
            System.out.println("Warning: Attempted to record page view for non-existent or ended session: " + sessionId);
        }
    }
    
    /**
     * End a session
     */
    @Transactional
    public void endSession(String sessionId) {
        Optional<UserSession> sessionOpt = userSessionRepository.findBySessionIdAndEndTimeIsNull(sessionId);
        if (sessionOpt.isPresent()) {
            UserSession session = sessionOpt.get();
            session.endSession();
            userSessionRepository.save(session);
        }
    }
    
    /**
     * End all active sessions for a user
     */
    @Transactional
    public void endUserSessions(Long userId) {
        List<UserSession> activeSessions = userSessionRepository.findByUserIdAndEndTimeIsNull(userId);
        for (UserSession session : activeSessions) {
            session.endSession();
        }
        userSessionRepository.saveAll(activeSessions);
    }
    
    /**
     * Get active sessions count for a time period
     */
    public int getActiveSessionsCount(String timeFrame) {
        LocalDateTime start;
        LocalDateTime end;
        LocalDateTime now = LocalDateTime.now();

        switch (timeFrame) {
            case "hour":
                start = now.minusHours(1);
                end = now;
                break;
            case "day":
                start = LocalDate.now().atStartOfDay();
                end = LocalDate.now().plusDays(1).atStartOfDay().minusNanos(1); // End of current day
                break;
            case "week":
                start = now.minusWeeks(1);
                end = now;
                break;
            case "month":
                start = LocalDate.now().withDayOfMonth(1).atStartOfDay(); // Start of current month
                end = YearMonth.from(now).atEndOfMonth().atTime(23, 59, 59, 999999999); // End of current month
                break;
            case "year":
                start = LocalDate.now().withDayOfYear(1).atStartOfDay(); // Start of current year
                end = LocalDate.now().with(TemporalAdjusters.lastDayOfYear()).atTime(23, 59, 59, 999999999); // End of current year
                break;
            default:
                start = LocalDate.now().atStartOfDay();
                end = LocalDate.now().plusDays(1).atStartOfDay().minusNanos(1);
                break;
        }
        
        return userSessionRepository.countActiveSessions(start, end);
    }
    
    /**
     * Get total sessions count for a time period
     */
    public int getTotalSessionsCount(String timeFrame) {
        LocalDateTime start;
        LocalDateTime end;
        LocalDateTime now = LocalDateTime.now();

        switch (timeFrame) {
            case "hour":
                start = now.minusHours(1);
                end = now;
                break;
            case "day":
                // Match SQL: WHERE DATE(start_time) = CURDATE()
                start = LocalDate.now().atStartOfDay();
                end = LocalDate.now().atTime(23, 59, 59, 999999999); // End of current day
                break;
            case "week":
                start = now.minusWeeks(1);
                end = now;
                break;
            case "month":
                // Match SQL: WHERE YEAR(start_time) = YEAR(CURDATE()) AND MONTH(start_time) = MONTH(CURDATE())
                start = LocalDate.now().withDayOfMonth(1).atStartOfDay(); // Start of current month
                end = YearMonth.from(now).atEndOfMonth().atTime(23, 59, 59, 999999999); // End of current month
                break;
            case "year":
                // Match SQL: WHERE YEAR(start_time) = YEAR(CURDATE())
                start = LocalDate.now().withDayOfYear(1).atStartOfDay(); // Start of current year
                end = LocalDate.now().with(TemporalAdjusters.lastDayOfYear()).atTime(23, 59, 59, 999999999); // End of current year
                break;
            default:
                start = LocalDate.now().atStartOfDay();
                end = LocalDate.now().atTime(23, 59, 59, 999999999);
                break;
        }
        
        System.out.println("🔍 getTotalSessionsCount called for timeFrame: " + timeFrame);
        System.out.println("📅 Time range: " + start + " to " + end);
        
        int count = userSessionRepository.countTotalSessions(start, end);
        System.out.println("📊 Total Sessions Count: " + count);
        
        return count;
    }
    
    public int getTotalSessionsCountForPeriod(LocalDateTime start, LocalDateTime end) {
        return userSessionRepository.countTotalSessions(start, end);
    }
    
    /**
     * Calculate bounce rate for a time period
     */
    public double getBounceRate(String timeFrame) {
        System.out.println("🔍 getBounceRate called for timeFrame: " + timeFrame);
        
        Map<String, LocalDateTime> timeRange = getTimeRange(timeFrame);
        LocalDateTime start = timeRange.get("start");
        LocalDateTime end = timeRange.get("end");
        
        System.out.println("📅 Time range: " + start + " to " + end);
        
        double bounceRate = calculateBounceRateForPeriod(start, end, timeFrame);
        System.out.println("📊 Bounce Rate: " + bounceRate + "%");
        
        return bounceRate;
    }
    
    public double getBounceRateForPeriod(LocalDateTime start, LocalDateTime end) {
        return calculateBounceRateForPeriod(start, end, "custom");
    }
    
    private double calculateBounceRateForPeriod(LocalDateTime start, LocalDateTime end, String timeFrame) {
        int totalSessions = userSessionRepository.countTotalSessions(start, end);
        int bounceSessions = userSessionRepository.countBounceSessions(start, end);
        
        System.out.println("🔍 Bounce Rate Debug for " + timeFrame + ":");
        System.out.println("   Start: " + start);
        System.out.println("   End: " + end);
        System.out.println("   Total Sessions: " + totalSessions);
        System.out.println("   Bounce Sessions: " + bounceSessions);
        
        if (totalSessions == 0) {
            System.out.println("   Result: 0.0 (no sessions)");
            return 0.0;
        }
        
        double bounceRate = (double) bounceSessions / totalSessions * 100.0;
        System.out.println("   Bounce Rate: " + bounceRate + "%");
        return bounceRate;
    }
    
    /**
     * Helper method to get start and end times for a time frame
     */
    private Map<String, LocalDateTime> getTimeRange(String timeFrame) {
        LocalDateTime start;
        LocalDateTime end;
        LocalDateTime now = LocalDateTime.now();

        switch (timeFrame) {
            case "hour":
                start = now.minusHours(1);
                end = now;
                break;
            case "day":
                // Match SQL: WHERE DATE(start_time) = CURDATE()
                start = LocalDate.now().atStartOfDay();
                end = LocalDate.now().atTime(23, 59, 59, 999999999); // End of current day
                break;
            case "week":
                start = now.minusWeeks(1);
                end = now;
                break;
            case "month":
                // Match SQL: WHERE YEAR(start_time) = YEAR(CURDATE()) AND MONTH(start_time) = MONTH(CURDATE())
                start = LocalDate.now().withDayOfMonth(1).atStartOfDay(); // Start of current month
                end = YearMonth.from(now).atEndOfMonth().atTime(23, 59, 59, 999999999); // End of current month
                break;
            case "year":
                // Match SQL: WHERE YEAR(start_time) = YEAR(CURDATE())
                start = LocalDate.now().withDayOfYear(1).atStartOfDay(); // Start of current year
                end = LocalDate.now().with(TemporalAdjusters.lastDayOfYear()).atTime(23, 59, 59, 999999999); // End of current year
                break;
            default:
                start = LocalDate.now().atStartOfDay();
                end = LocalDate.now().atTime(23, 59, 59, 999999999);
                break;
        }
        
        Map<String, LocalDateTime> result = new HashMap<>();
        result.put("start", start);
        result.put("end", end);
        return result;
    }
    
    /**
     * Get session trends for dashboard
     */
    public List<Map<String, Object>> getSessionTrends(String timeFrame) {
        Map<String, LocalDateTime> timeRange = getTimeRange(timeFrame);
        LocalDateTime start = timeRange.get("start");
        LocalDateTime end = timeRange.get("end");
        
        List<Object[]> results;
        switch (timeFrame) {
            case "hour":
                results = userSessionRepository.getSessionStatsByHour(start, end);
                return processHourlyResults(results);
            case "week":
                results = userSessionRepository.getSessionStatsByWeek(start, end);
                return processWeeklyResults(results);
            case "month":
                results = userSessionRepository.getSessionStatsByMonth(start, end);
                return processMonthlyResults(results);
            case "year":
                results = userSessionRepository.getSessionStatsByMonth(start, end);
                return processYearlyResults(results);
            default: // day
                results = userSessionRepository.getSessionStatsByDate(start, end);
                return processDailyResults(results);
        }
    }
    
    /**
     * Get session statistics for dashboard metrics
     */
    public Map<String, Object> getSessionStats(String timeFrame) {
        System.out.println("🔍 getSessionStats called with timeFrame: " + timeFrame);
        LocalDateTime start;
        LocalDateTime end;
        LocalDateTime now = LocalDateTime.now();

        switch (timeFrame) {
            case "hour":
                start = now.minusHours(1);
                end = now;
                break;
            case "day":
                start = LocalDate.now().atStartOfDay();
                end = LocalDate.now().plusDays(1).atStartOfDay().minusNanos(1); // End of current day
                break;
            case "week":
                start = now.minusWeeks(1);
                end = now;
                break;
            case "month":
                start = LocalDate.now().withDayOfMonth(1).atStartOfDay(); // Start of current month
                end = YearMonth.from(now).atEndOfMonth().atTime(23, 59, 59, 999999999); // End of current month
                break;
            case "year":
                start = LocalDate.now().withDayOfYear(1).atStartOfDay(); // Start of current year
                end = LocalDate.now().with(TemporalAdjusters.lastDayOfYear()).atTime(23, 59, 59, 999999999); // End of current year
                break;
            default:
                start = LocalDate.now().atStartOfDay();
                end = LocalDate.now().plusDays(1).atStartOfDay().minusNanos(1);
                break;
        }
        
        System.out.println("📅 Time range: " + start + " to " + end);

        // Get session counts
        int totalSessions = userSessionRepository.countTotalSessions(start, end);
        int bounceSessions = userSessionRepository.countBounceSessions(start, end);
        int activeSessions = userSessionRepository.countActiveSessions(start, end);
        
        System.out.println("📊 Raw counts - Total: " + totalSessions + ", Bounce: " + bounceSessions + ", Active: " + activeSessions);
        
        // Calculate bounce rate
        double bounceRate = totalSessions > 0 ? (double) bounceSessions / totalSessions * 100.0 : 0.0;
        
        // Get session trends for the time period
        List<Object[]> trends;
        switch (timeFrame) {
            case "hour":
                trends = userSessionRepository.getSessionStatsByHour(start, end);
                break;
            case "week":
                trends = userSessionRepository.getSessionStatsByWeek(start, end);
                break;
            case "month":
                trends = userSessionRepository.getSessionStatsByMonth(start, end);
                break;
            case "year":
                trends = userSessionRepository.getSessionStatsByMonth(start, end);
                break;
            default: // day
                trends = userSessionRepository.getSessionStatsByDate(start, end);
                break;
        }
        
        // Calculate total sessions from trends to verify data
        int trendTotalSessions = 0;
        if (!trends.isEmpty()) {
            for (Object[] trend : trends) {
                trendTotalSessions += ((Number) trend[1]).intValue(); // totalSessions is at index 1
            }
            // If trends show sessions but direct count doesn't, use trend data
            if (trendTotalSessions > 0 && totalSessions == 0) {
                totalSessions = trendTotalSessions;
                // Recalculate bounce rate with new total
                bounceRate = totalSessions > 0 ? (double) bounceSessions / totalSessions * 100.0 : 0.0;
            }
        }
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSessions", totalSessions);
        stats.put("activeSessions", activeSessions);
        stats.put("bounceSessions", bounceSessions);
        stats.put("bounceRate", Math.round(bounceRate * 100.0) / 100.0); // Round to 2 decimal places
        
        System.out.println("📤 Returning stats: " + stats);
        
        return stats;
    }
    
    /**
     * Get engagement analytics for dashboard
     */
    public Map<String, Object> getEngagementAnalytics(String timeFrame) {
        Map<String, LocalDateTime> timeRange = getTimeRange(timeFrame);
        LocalDateTime start = timeRange.get("start");
        LocalDateTime end = timeRange.get("end");
        
        // Get total page views and engagement metrics
        int totalPageViews = userSessionRepository.countTotalPageViews(start, end);
        int totalSessions = userSessionRepository.countTotalSessions(start, end);
        double avgPageViewsPerSession = totalSessions > 0 ? (double) totalPageViews / totalSessions : 0.0;
        
        // Calculate engagement score (based on page views and session duration)
        double engagementScore = calculateEngagementScore(start, end);
        
        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalPageViews", totalPageViews);
        analytics.put("avgPageViewsPerSession", Math.round(avgPageViewsPerSession * 100.0) / 100.0);
        analytics.put("engagementScore", Math.round(engagementScore * 100.0) / 100.0);
        analytics.put("totalSessions", totalSessions);
        
        return analytics;
    }
    
    /**
     * Get engagement trends for dashboard chart
     */
    public List<Map<String, Object>> getEngagementTrends(String timeFrame) {
        Map<String, LocalDateTime> timeRange = getTimeRange(timeFrame);
        LocalDateTime start = timeRange.get("start");
        LocalDateTime end = timeRange.get("end");
        
        List<Object[]> results;
        switch (timeFrame) {
            case "hour":
                results = userSessionRepository.getEngagementStatsByHour(start, end);
                return processEngagementHourlyResults(results);
            case "week":
                results = userSessionRepository.getEngagementStatsByWeek(start, end);
                return processEngagementWeeklyResults(results);
            case "month":
                results = userSessionRepository.getEngagementStatsByMonth(start, end);
                return processEngagementMonthlyResults(results);
            case "year":
                results = userSessionRepository.getEngagementStatsByMonth(start, end);
                return processEngagementYearlyResults(results);
            default: // day
                results = userSessionRepository.getEngagementStatsByDate(start, end);
                return processEngagementDailyResults(results);
        }
    }
    
    /**
     * Calculate engagement score based on page views and session duration
     */
    private double calculateEngagementScore(LocalDateTime start, LocalDateTime end) {
        List<UserSession> sessions = userSessionRepository.findByStartTimeBetween(start, end);
        
        if (sessions.isEmpty()) return 0.0;
        
        double totalScore = 0.0;
        for (UserSession session : sessions) {
            // Score based on page views (higher = more engaged)
            double pageViewScore = Math.min(session.getPageCount() * 10.0, 50.0);
            
            // Score based on session duration (if available)
            double durationScore = 0.0;
            if (session.getEndTime() != null) {
                long durationMinutes = java.time.Duration.between(session.getStartTime(), session.getEndTime()).toMinutes();
                durationScore = Math.min(durationMinutes * 2.0, 30.0);
            }
            
            totalScore += pageViewScore + durationScore;
        }
        
        return totalScore / sessions.size();
    }
    
    /**
     * Clean up old sessions (can be called by a scheduled task)
     */
    public void cleanupOldSessions() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30); // Keep 30 days of data
        userSessionRepository.deleteOldSessions(cutoffDate);
    }
    
    /**
     * Get customer segmentation for dashboard
     */
    public List<Map<String, Object>> getCustomerSegmentation(String timeFrame) {
        System.out.println("🔄 SessionService: getCustomerSegmentation called with timeFrame: " + timeFrame);
        System.out.println("🔄 SessionService: Method entry - starting VIP tier data processing");
        try {
            Map<String, LocalDateTime> timeRange = getTimeRange(timeFrame);
            LocalDateTime start = timeRange.get("start");
            LocalDateTime end = timeRange.get("end");
            System.out.println("📊 SessionService: Time range - Start: " + start + ", End: " + end);
            
            // Check user stats first
            List<Object[]> userStats = userSessionRepository.getUserStats();
            if (!userStats.isEmpty()) {
                Object[] stats = userStats.get(0);
                System.out.println("📊 SessionService: User Stats - Total: " + stats[0] + ", With Points: " + stats[1] + ", Min Points: " + stats[2] + ", Max Points: " + stats[3]);
            }
            
            // Get VIP tier data from database - use correct method that matches VIP customer page
            System.out.println("📊 SessionService: Calling getCorrectVipTierStats() from database...");
            List<Object[]> results = userSessionRepository.getCorrectVipTierStats();
            System.out.println("📊 SessionService: Correct VIP Tier Results: " + results.size() + " rows");
            for (Object[] row : results) {
                System.out.println("📊 SessionService: Tier: " + row[0] + ", Count: " + row[1]);
            }
            
            // Also test the simpler method to compare
            System.out.println("📊 SessionService: Testing getVipTierStatsSimple() for comparison...");
            List<Object[]> simpleResults = userSessionRepository.getVipTierStatsSimple();
            System.out.println("📊 SessionService: Simple VIP Tier Results: " + simpleResults.size() + " rows");
            for (Object[] row : simpleResults) {
                System.out.println("📊 SessionService: Simple Tier: " + row[0] + ", Count: " + row[1]);
            }
            
            List<Map<String, Object>> segmentation = new ArrayList<>();
            
            // Define VIP tier colors - dynamic based on tier names
            Map<String, String> tierColors = new HashMap<>();
            tierColors.put("Regular", "#708090"); // Gray
            tierColors.put("Silver", "#C0C0C0"); // Silver
            tierColors.put("Gold", "#FFD700");   // Gold
            tierColors.put("Platinum", "#E5E4E2"); // Platinum
            tierColors.put("Diamond", "#B9F2FF"); // Diamond
            tierColors.put("Ruby", "#E0115F");   // Ruby
            tierColors.put("Emerald", "#50C878"); // Emerald
            // Add more colors for future tiers as needed
            
            // Process results and create tier data
            System.out.println("📊 SessionService: Processing " + results.size() + " tier results");
            for (Object[] row : results) {
                String tierName = row[0].toString();
                int userCount = ((Number) row[1]).intValue();
                
                System.out.println("📊 SessionService: Processing tier - Name: " + tierName + ", Count: " + userCount);
                
                Map<String, Object> tier = new HashMap<>();
                tier.put("name", tierName);
                tier.put("color", tierColors.getOrDefault(tierName, "#708090"));
                tier.put("value", userCount);
                
                segmentation.add(tier);
                System.out.println("📊 SessionService: Added tier to segmentation: " + tier);
            }
            
            System.out.println("📊 SessionService: Initial segmentation size: " + segmentation.size());
            
            // Always ensure all tiers from vip_tiers table are present
            Map<String, Integer> tierCounts = new HashMap<>();
            for (Map<String, Object> tier : segmentation) {
                tierCounts.put((String) tier.get("name"), (Integer) tier.get("value"));
            }
            System.out.println("📊 SessionService: Tier counts mapping: " + tierCounts);
            
            // Get all tiers from vip_tiers table to ensure completeness
            System.out.println("📊 SessionService: Calling getAllVipTiers() from database...");
            List<Object[]> allTiers = userSessionRepository.getAllVipTiers();
            System.out.println("📊 SessionService: All tiers from database: " + allTiers.size() + " tiers");
            for (Object[] tierRow : allTiers) {
                System.out.println("📊 SessionService: Database tier - Name: " + tierRow[0] + ", Min Points: " + tierRow[1]);
            }
            
            List<Map<String, Object>> completeSegmentation = new ArrayList<>();
            
            for (Object[] tierRow : allTiers) {
                String tierName = tierRow[0].toString();
                int tierCount = tierCounts.getOrDefault(tierName, 0);
                String tierColor = tierColors.getOrDefault(tierName, "#708090");
                
                System.out.println("📊 SessionService: Creating complete tier - Name: " + tierName + ", Count: " + tierCount + ", Color: " + tierColor);
                
                Map<String, Object> completeTier = createTier(tierName, tierColor, tierCount);
                completeSegmentation.add(completeTier);
                
                System.out.println("📊 SessionService: Added complete tier: " + completeTier);
            }
            
            System.out.println("📊 SessionService: Final completeSegmentation size: " + completeSegmentation.size());
            for (Map<String, Object> tier : completeSegmentation) {
                System.out.println("📊 SessionService: Final Tier - " + tier.get("name") + ": " + tier.get("value") + " users, Color: " + tier.get("color"));
            }
            return completeSegmentation;
        } catch (Exception e) {
            // Log the error and return default data
            System.err.println("❌ SessionService: Error getting customer segmentation: " + e.getMessage());
            e.printStackTrace();
            
            List<Map<String, Object>> defaultSegmentation = new ArrayList<>();
            defaultSegmentation.add(createTier("Regular", "#708090", 0));
            defaultSegmentation.add(createTier("Silver", "#C0C0C0", 0));
            defaultSegmentation.add(createTier("Gold", "#FFD700", 0));
            defaultSegmentation.add(createTier("Platinum", "#E5E4E2", 0));
            
            System.out.println("📊 SessionService: Returning default segmentation due to error");
            return defaultSegmentation;
        }
    }
    
    private Map<String, Object> createTier(String name, String color, int value) {
        System.out.println("📊 SessionService: Creating tier object - Name: " + name + ", Color: " + color + ", Value: " + value);
        Map<String, Object> tier = new HashMap<>();
        tier.put("name", name);
        tier.put("color", color);
        tier.put("value", value);
        System.out.println("📊 SessionService: Created tier object: " + tier);
        return tier;
    }
    
    /**
     * Get customer acquisition data for the specified time frame
     */
    public List<Map<String, Object>> getCustomerAcquisition(String timeFrame) {
        Map<String, LocalDateTime> timeRange = getTimeRange(timeFrame);
        LocalDateTime start = timeRange.get("start");
        LocalDateTime end = timeRange.get("end");
        
        System.out.println("Getting customer acquisition data for timeFrame: " + timeFrame);
        System.out.println("Start time: " + start);
        System.out.println("End time: " + end);
        
        List<Object[]> results;
        switch (timeFrame) {
            case "hour":
                results = userSessionRepository.getCustomerAcquisitionStatsByHour(start, end);
                break;
            case "week":
                results = userSessionRepository.getCustomerAcquisitionStatsByWeek(start, end);
                break;
            case "month":
                results = userSessionRepository.getCustomerAcquisitionStatsByMonth(start, end);
                break;
            case "year":
                results = userSessionRepository.getCustomerAcquisitionStatsByMonth(start, end); // Use monthly for yearly
                break;
            case "day":
            default:
                results = userSessionRepository.getCustomerAcquisitionStats(start, end);
                break;
        }
        
        System.out.println("Raw results from database: " + results.size() + " rows");
        for (Object[] row : results) {
            System.out.println("Row: " + Arrays.toString(row));
        }
        
        // Process results based on time frame to fill in missing periods
        List<Map<String, Object>> processedResults;
        switch (timeFrame) {
            case "hour":
                processedResults = processCustomerAcquisitionHourlyResults(results);
                break;
            case "day":
                processedResults = processCustomerAcquisitionDailyResults(results);
                break;
            case "week":
                processedResults = processCustomerAcquisitionWeeklyResults(results);
                break;
            case "month":
                processedResults = processCustomerAcquisitionMonthlyResults(results);
                break;
            case "year":
                processedResults = processCustomerAcquisitionYearlyResults(results);
                break;
            default:
                processedResults = processCustomerAcquisitionDailyResults(results);
                break;
        }
        
        System.out.println("Processed results: " + processedResults.size() + " rows");
        for (Map<String, Object> result : processedResults) {
            System.out.println("Processed: " + result);
        }
        
        return processedResults;
    }
    

    
    private List<Map<String, Object>> processDailyResults(List<Object[]> results) {
        // Build a map from date string to result row
        Map<String, Object[]> resultMap = new HashMap<>();
        for (Object[] row : results) {
            resultMap.put(row[0].toString(), row);
        }

        List<Map<String, Object>> filled = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(6); // last 7 days

        for (LocalDate date = start; !date.isAfter(today); date = date.plusDays(1)) {
            String dateStr = date.toString();
            Object[] row = resultMap.get(dateStr);
            Map<String, Object> map = new HashMap<>();
            map.put("period", dateStr);
            if (row != null) {
                map.put("totalSessions", ((Number) row[1]).intValue());
                map.put("bounceSessions", ((Number) row[2]).intValue());
                map.put("uniqueUsers", ((Number) row[3]).intValue());
            } else {
                map.put("totalSessions", 0);
                map.put("bounceSessions", 0);
                map.put("uniqueUsers", 0);
            }
            filled.add(map);
        }
        return filled;
    }
    
    private List<Map<String, Object>> processHourlyResults(List<Object[]> results) {
        // Build a map from date+hour string to result row
        Map<String, Object[]> resultMap = new HashMap<>();
        for (Object[] row : results) {
            String date = row[0].toString();
            int hour = ((Number) row[1]).intValue();
            String key = date + "_" + hour;
            resultMap.put(key, row);
        }

        List<Map<String, Object>> filled = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = now.minusHours(23); // last 24 hours

        for (LocalDateTime time = start; !time.isAfter(now); time = time.plusHours(1)) {
            String date = time.toLocalDate().toString();
            int hour = time.getHour();
            String key = date + "_" + hour;
            Object[] row = resultMap.get(key);
            
            Map<String, Object> map = new HashMap<>();
            map.put("period", date + " " + String.format("%02d:00", hour));
            if (row != null) {
                map.put("totalSessions", ((Number) row[2]).intValue());
                map.put("bounceSessions", ((Number) row[3]).intValue());
            } else {
                map.put("totalSessions", 0);
                map.put("bounceSessions", 0);
            }
            filled.add(map);
        }
        return filled;
    }
    
    private List<Map<String, Object>> processWeeklyResults(List<Object[]> results) {
        // Build a map from week string to result row
        Map<String, Object[]> resultMap = new HashMap<>();
        for (Object[] row : results) {
            resultMap.put(row[0].toString(), row);
        }

        List<Map<String, Object>> filled = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusWeeks(7); // last 8 weeks

        for (LocalDate date = start; !date.isAfter(today); date = date.plusWeeks(1)) {
            int week = date.get(ChronoField.ALIGNED_WEEK_OF_YEAR);
            String weekKey = String.valueOf(week);
            Object[] row = resultMap.get(weekKey);
            
            Map<String, Object> map = new HashMap<>();
            map.put("period", "Week " + weekKey);
            if (row != null) {
                map.put("totalSessions", ((Number) row[1]).intValue());
                map.put("bounceSessions", ((Number) row[2]).intValue());
            } else {
                map.put("totalSessions", 0);
                map.put("bounceSessions", 0);
            }
            filled.add(map);
        }
        return filled;
    }
    
    private List<Map<String, Object>> processMonthlyResults(List<Object[]> results) {
        // Build a map from year_month string to result row
        Map<String, Object[]> resultMap = new HashMap<>();
        for (Object[] row : results) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            String key = year + "_" + month;
            resultMap.put(key, row);
        }

        List<Map<String, Object>> filled = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusMonths(11); // last 12 months

        for (LocalDate date = start; !date.isAfter(today); date = date.plusMonths(1)) {
            int year = date.getYear();
            int month = date.getMonthValue();
            String key = year + "_" + month;
            Object[] row = resultMap.get(key);
            
            Map<String, Object> map = new HashMap<>();
            map.put("period", year + "-" + String.format("%02d", month));
            if (row != null) {
                map.put("totalSessions", ((Number) row[2]).intValue());
                map.put("bounceSessions", ((Number) row[3]).intValue());
            } else {
                map.put("totalSessions", 0);
                map.put("bounceSessions", 0);
            }
            filled.add(map);
        }
        return filled;
    }
    
    private List<Map<String, Object>> processYearlyResults(List<Object[]> results) {
        return results.stream().map(row -> {
            Map<String, Object> map = new HashMap<>();
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            map.put("period", String.format("%d-%02d", year, month));
            map.put("totalSessions", ((Number) row[2]).intValue());
            map.put("bounceSessions", ((Number) row[3]).intValue());
            return map;
        }).collect(Collectors.toList());
    }
    
    // Engagement processing methods
    private List<Map<String, Object>> processEngagementDailyResults(List<Object[]> results) {
        // Build a map from date string to result row
        Map<String, Object[]> resultMap = new HashMap<>();
        for (Object[] row : results) {
            resultMap.put(row[0].toString(), row);
        }

        List<Map<String, Object>> filled = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(6); // last 7 days

        for (LocalDate date = start; !date.isAfter(today); date = date.plusDays(1)) {
            String dateStr = date.toString();
            Object[] row = resultMap.get(dateStr);
            Map<String, Object> map = new HashMap<>();
            map.put("period", dateStr);
            if (row != null) {
                map.put("views", ((Number) row[1]).intValue()); // totalPageViews
                map.put("engagement", ((Number) row[3]).doubleValue()); // avgPageViews
            } else {
                map.put("views", 0);
                map.put("engagement", 0.0);
            }
            filled.add(map);
        }
        return filled;
    }
    
    private List<Map<String, Object>> processEngagementHourlyResults(List<Object[]> results) {
        // Build a map from date+hour string to result row
        Map<String, Object[]> resultMap = new HashMap<>();
        for (Object[] row : results) {
            String date = row[0].toString();
            int hour = ((Number) row[1]).intValue();
            String key = date + "_" + hour;
            resultMap.put(key, row);
        }

        List<Map<String, Object>> filled = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = now.minusHours(23); // last 24 hours

        for (LocalDateTime time = start; !time.isAfter(now); time = time.plusHours(1)) {
            String date = time.toLocalDate().toString();
            int hour = time.getHour();
            String key = date + "_" + hour;
            Object[] row = resultMap.get(key);
            
            Map<String, Object> map = new HashMap<>();
            map.put("period", date + " " + String.format("%02d:00", hour));
            if (row != null) {
                map.put("views", ((Number) row[2]).intValue()); // totalPageViews
                map.put("engagement", ((Number) row[2]).intValue() * 0.8); // engagement score
            } else {
                map.put("views", 0);
                map.put("engagement", 0.0);
            }
            filled.add(map);
        }
        return filled;
    }
    
    private List<Map<String, Object>> processEngagementWeeklyResults(List<Object[]> results) {
        // Build a map from week string to result row
        Map<String, Object[]> resultMap = new HashMap<>();
        for (Object[] row : results) {
            resultMap.put(row[0].toString(), row);
        }

        List<Map<String, Object>> filled = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusWeeks(7); // last 8 weeks

        for (LocalDate date = start; !date.isAfter(today); date = date.plusWeeks(1)) {
            int week = date.get(ChronoField.ALIGNED_WEEK_OF_YEAR);
            String weekKey = String.valueOf(week);
            Object[] row = resultMap.get(weekKey);
            
            Map<String, Object> map = new HashMap<>();
            map.put("period", "Week " + weekKey);
            if (row != null) {
                map.put("views", ((Number) row[1]).intValue()); // totalPageViews
                map.put("engagement", ((Number) row[1]).intValue() * 0.7); // engagement score
            } else {
                map.put("views", 0);
                map.put("engagement", 0.0);
            }
            filled.add(map);
        }
        return filled;
    }
    
    private List<Map<String, Object>> processEngagementMonthlyResults(List<Object[]> results) {
        // Build a map from year_month string to result row
        Map<String, Object[]> resultMap = new HashMap<>();
        for (Object[] row : results) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            String key = year + "_" + month;
            resultMap.put(key, row);
        }

        List<Map<String, Object>> filled = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusMonths(11); // last 12 months

        for (LocalDate date = start; !date.isAfter(today); date = date.plusMonths(1)) {
            int year = date.getYear();
            int month = date.getMonthValue();
            String key = year + "_" + month;
            Object[] row = resultMap.get(key);
            
            Map<String, Object> map = new HashMap<>();
            map.put("period", year + "-" + String.format("%02d", month));
            if (row != null) {
                map.put("views", ((Number) row[2]).intValue()); // totalPageViews
                map.put("engagement", ((Number) row[2]).intValue() * 0.6); // engagement score
            } else {
                map.put("views", 0);
                map.put("engagement", 0.0);
            }
            filled.add(map);
        }
        return filled;
    }
    
    private List<Map<String, Object>> processEngagementYearlyResults(List<Object[]> results) {
        return results.stream().map(row -> {
            Map<String, Object> map = new HashMap<>();
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            map.put("period", String.format("%d-%02d", year, month));
            map.put("views", ((Number) row[2]).intValue()); // totalPageViews
            map.put("engagement", ((Number) row[2]).intValue() * 0.5); // engagement score
            return map;
        }).collect(Collectors.toList());
    }

    // Customer Acquisition processing methods
    private List<Map<String, Object>> processCustomerAcquisitionHourlyResults(List<Object[]> results) {
        System.out.println("Processing hourly customer acquisition results: " + results.size() + " rows");
        
        // Build a map from date+hour string to result row
        Map<String, Object[]> resultMap = new HashMap<>();
        for (Object[] row : results) {
            String date = row[0].toString();
            int hour = ((Number) row[1]).intValue();
            String key = date + "_" + hour;
            resultMap.put(key, row);
            System.out.println("Raw hourly row: " + Arrays.toString(row) + " -> key: " + key);
        }

        List<Map<String, Object>> filled = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = now.minusHours(23); // last 24 hours

        System.out.println("Filling hourly data from " + start + " to " + now);

        for (LocalDateTime time = start; !time.isAfter(now); time = time.plusHours(1)) {
            String date = time.toLocalDate().toString();
            int hour = time.getHour();
            String key = date + "_" + hour;
            Object[] row = resultMap.get(key);
            
            Map<String, Object> map = new HashMap<>();
            map.put("period", date + " " + String.format("%02d:00", hour));
            if (row != null) {
                map.put("acquired", ((Number) row[2]).intValue());
                map.put("churned", ((Number) row[3]).intValue());
                map.put("retained", ((Number) row[4]).intValue());
                System.out.println("Hour " + key + ": acquired=" + ((Number) row[2]).intValue() + 
                                 ", churned=" + ((Number) row[3]).intValue() + 
                                 ", retained=" + ((Number) row[4]).intValue());
            } else {
                map.put("acquired", 0);
                map.put("churned", 0);
                map.put("retained", 0);
                System.out.println("Hour " + key + ": no data, using zeros");
            }
            filled.add(map);
        }
        
        System.out.println("Final processed hourly data: " + filled.size() + " hours");
        return filled;
    }

    private List<Map<String, Object>> processCustomerAcquisitionDailyResults(List<Object[]> results) {
        System.out.println("Processing daily customer acquisition results: " + results.size() + " rows");
        
        // Build a map from date string to result row
        Map<String, Object[]> resultMap = new HashMap<>();
        for (Object[] row : results) {
            String dateKey = row[0].toString();
            resultMap.put(dateKey, row);
            System.out.println("Raw row: " + Arrays.toString(row) + " -> key: " + dateKey);
        }

        List<Map<String, Object>> filled = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(6); // last 7 days

        System.out.println("Filling data from " + start + " to " + today);

        for (LocalDate date = start; !date.isAfter(today); date = date.plusDays(1)) {
            String dateStr = date.toString();
            Object[] row = resultMap.get(dateStr);
            Map<String, Object> map = new HashMap<>();
            map.put("period", dateStr);
            if (row != null) {
                map.put("acquired", ((Number) row[1]).intValue());
                map.put("churned", ((Number) row[2]).intValue());
                map.put("retained", ((Number) row[3]).intValue());
                System.out.println("Date " + dateStr + ": acquired=" + ((Number) row[1]).intValue() + 
                                 ", churned=" + ((Number) row[2]).intValue() + 
                                 ", retained=" + ((Number) row[3]).intValue());
            } else {
                map.put("acquired", 0);
                map.put("churned", 0);
                map.put("retained", 0);
                System.out.println("Date " + dateStr + ": no data, using zeros");
            }
            filled.add(map);
        }
        
        System.out.println("Final processed data: " + filled.size() + " days");
        return filled;
    }

    private List<Map<String, Object>> processCustomerAcquisitionWeeklyResults(List<Object[]> results) {
        System.out.println("Processing weekly customer acquisition results: " + results.size() + " rows");
        
        // Build a map from week string to result row
        Map<String, Object[]> resultMap = new HashMap<>();
        for (Object[] row : results) {
            String weekKey = row[0].toString();
            resultMap.put(weekKey, row);
            System.out.println("Raw weekly row: " + Arrays.toString(row) + " -> key: " + weekKey);
        }

        List<Map<String, Object>> filled = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusWeeks(7); // last 8 weeks

        System.out.println("Filling weekly data from " + start + " to " + today);

        for (LocalDate date = start; !date.isAfter(today); date = date.plusWeeks(1)) {
            int week = date.get(ChronoField.ALIGNED_WEEK_OF_YEAR);
            String weekKey = String.valueOf(week);
            Object[] row = resultMap.get(weekKey);
            
            Map<String, Object> map = new HashMap<>();
            map.put("period", "Week " + weekKey);
            if (row != null) {
                map.put("acquired", ((Number) row[1]).intValue());
                map.put("churned", ((Number) row[2]).intValue());
                map.put("retained", ((Number) row[3]).intValue());
                System.out.println("Week " + weekKey + ": acquired=" + ((Number) row[1]).intValue() + 
                                 ", churned=" + ((Number) row[2]).intValue() + 
                                 ", retained=" + ((Number) row[3]).intValue());
            } else {
                map.put("acquired", 0);
                map.put("churned", 0);
                map.put("retained", 0);
                System.out.println("Week " + weekKey + ": no data, using zeros");
            }
            filled.add(map);
        }
        
        System.out.println("Final processed weekly data: " + filled.size() + " weeks");
        return filled;
    }

    private List<Map<String, Object>> processCustomerAcquisitionMonthlyResults(List<Object[]> results) {
        System.out.println("Processing monthly customer acquisition results: " + results.size() + " rows");
        
        // Build a map from year_month string to result row
        Map<String, Object[]> resultMap = new HashMap<>();
        for (Object[] row : results) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            String key = year + "_" + month;
            resultMap.put(key, row);
            System.out.println("Raw monthly row: " + Arrays.toString(row) + " -> key: " + key);
        }

        List<Map<String, Object>> filled = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusMonths(11); // last 12 months

        System.out.println("Filling monthly data from " + start + " to " + today);

        for (LocalDate date = start; !date.isAfter(today); date = date.plusMonths(1)) {
            int year = date.getYear();
            int month = date.getMonthValue();
            String key = year + "_" + month;
            Object[] row = resultMap.get(key);
            
            Map<String, Object> map = new HashMap<>();
            map.put("period", year + "-" + String.format("%02d", month));
            if (row != null) {
                map.put("acquired", ((Number) row[2]).intValue());
                map.put("churned", ((Number) row[3]).intValue());
                map.put("retained", ((Number) row[4]).intValue());
                System.out.println("Month " + key + ": acquired=" + ((Number) row[2]).intValue() + 
                                 ", churned=" + ((Number) row[3]).intValue() + 
                                 ", retained=" + ((Number) row[4]).intValue());
            } else {
                map.put("acquired", 0);
                map.put("churned", 0);
                map.put("retained", 0);
                System.out.println("Month " + key + ": no data, using zeros");
            }
            filled.add(map);
        }
        
        System.out.println("Final processed monthly data: " + filled.size() + " months");
        return filled;
    }

    private List<Map<String, Object>> processCustomerAcquisitionYearlyResults(List<Object[]> results) {
        System.out.println("Processing yearly customer acquisition results: " + results.size() + " rows");
        
        return results.stream().map(row -> {
            Map<String, Object> map = new HashMap<>();
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            map.put("period", String.format("%d-%02d", year, month));
            map.put("acquired", ((Number) row[2]).intValue());
            map.put("churned", ((Number) row[3]).intValue());
            map.put("retained", ((Number) row[4]).intValue());
            System.out.println("Year " + year + "-" + month + ": acquired=" + ((Number) row[2]).intValue() + 
                             ", churned=" + ((Number) row[3]).intValue() + 
                             ", retained=" + ((Number) row[4]).intValue());
            return map;
        }).collect(Collectors.toList());
    }
} 