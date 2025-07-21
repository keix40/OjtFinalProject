package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.UserActivity;
import com.Ojt.Ecommerce.repository.UserActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserActivityService {
    @Autowired
    private UserActivityRepository userActivityRepository;

    @Autowired
    private DashboardBroadcastService dashboardBroadcastService;

    public void logActivity(Long userId, String activityType) {
        UserActivity activity = new UserActivity();
        activity.setUserId(userId);
        activity.setActivityType(activityType);
        activity.setActivityTime(LocalDateTime.now());
        userActivityRepository.save(activity);
        // Broadcast dashboard metrics after user activity
        dashboardBroadcastService.broadcastDashboardMetrics("day");
    }

    public int countActiveUsers(LocalDateTime start, LocalDateTime end) {
        java.util.List<String> types = java.util.Arrays.asList("login", "order", "page_view");
        return userActivityRepository.countDistinctUserIdByActivityTimeBetweenAndActivityTypeIn(start, end, types);
    }

    public List<UserActivity> getActivitiesBetween(LocalDateTime start, LocalDateTime end) {
        return userActivityRepository.findByActivityTimeBetween(start, end);
    }
} 