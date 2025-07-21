package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.RevenueTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RevenueTargetRepository extends JpaRepository<RevenueTarget, Long> {
    Optional<RevenueTarget> findByPeriodTypeAndPeriodValue(String periodType, String periodValue);
} 