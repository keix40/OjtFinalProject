package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.VipTier;
import java.util.List;
import java.time.YearMonth;
import java.util.Map;

public interface VipTierService {
    List<VipTier> getAllTiers();
    VipTier getTierById(Long id);
    VipTier createTier(VipTier tier);
    VipTier updateTier(Long id, VipTier tier);
    void deleteTier(Long id);
    int countVipCustomersInMonth(YearMonth month);
    int countTotalVipCustomersAtEndOfMonth(YearMonth month);
    double sumVipRevenueInYear(int year);
    double getVipAvgOrderValue();
    double getRegularAvgOrderValue();
    Map<String, Object> getLoyaltyScoreGrowth();
} 