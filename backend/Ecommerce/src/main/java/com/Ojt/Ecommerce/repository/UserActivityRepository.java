package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    @Query("SELECT COUNT(DISTINCT ua.userId) FROM UserActivity ua WHERE ua.activityTime BETWEEN :start AND :end")
    int countDistinctUserIdByActivityTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(DISTINCT ua.userId) FROM UserActivity ua WHERE ua.activityTime BETWEEN :start AND :end AND ua.activityType IN :types")
    int countDistinctUserIdByActivityTimeBetweenAndActivityTypeIn(@Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end, @Param("types") java.util.List<String> types);

    List<UserActivity> findByActivityTimeBetween(LocalDateTime start, LocalDateTime end);

    // Find the most recent activity for a user
    UserActivity findTopByUserIdOrderByActivityTimeDesc(Long userId);
} 