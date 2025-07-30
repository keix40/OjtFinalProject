package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.RevenueTarget;
import com.Ojt.Ecommerce.repository.RevenueTargetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class RevenueTargetService {
    @Autowired
    private RevenueTargetRepository revenueTargetRepository;

    public Optional<RevenueTarget> getTarget(String periodType, String periodValue) {
        return revenueTargetRepository.findByPeriodTypeAndPeriodValue(periodType, periodValue);
    }

    public RevenueTarget setTarget(String periodType, String periodValue, Double targetAmount) {
        Optional<RevenueTarget> existing = revenueTargetRepository.findByPeriodTypeAndPeriodValue(periodType, periodValue);
        RevenueTarget target = existing.orElseGet(RevenueTarget::new);
        target.setPeriodType(periodType);
        target.setPeriodValue(periodValue);
        target.setTargetAmount(targetAmount);
        return revenueTargetRepository.save(target);
    }
} 