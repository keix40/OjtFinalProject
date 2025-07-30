package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.entity.VipTier;
import com.Ojt.Ecommerce.service.VipTierService;
import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;
import com.Ojt.Ecommerce.constants.PermissionConstants;
import com.Ojt.Ecommerce.annotations.RequiresPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;

@RestController
@RequestMapping("/api/vip-tiers")
@RequiredArgsConstructor
@PermissionCategoryTag(value = "vip_tiers",name = "VIP Tiers",icon = "fa-user-tag")
public class VipTierController {
    private final VipTierService vipTierService;

    @RequiresPermission(value = PermissionConstants.VIP_TIERS_VIEW,description = "View all VIP tiers")
    @GetMapping
    public List<VipTier> getAllTiers() {
        return vipTierService.getAllTiers();
    }

    @GetMapping("/{id}")
    public VipTier getTierById(@PathVariable Long id) {
        return vipTierService.getTierById(id);
    }

    @RequiresPermission(value = PermissionConstants.VIP_TIERS_CREATE,description = "Create a new VIP tier")
    @PostMapping
    public VipTier createTier(@RequestBody VipTier tier) {
        return vipTierService.createTier(tier);
    }

    @RequiresPermission(value = PermissionConstants.VIP_TIERS_UPDATE,description = "Update a VIP tier")
    @PutMapping("/{id}")
    public VipTier updateTier(@PathVariable Long id, @RequestBody VipTier tier) {
        return vipTierService.updateTier(id, tier);
    }

    @RequiresPermission(value = PermissionConstants.VIP_TIERS_DELETE,description = "Delete a VIP tier")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTier(@PathVariable Long id) {
        vipTierService.deleteTier(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats/customers-growth")
    public Map<String, Object> getVipCustomersGrowth() {
        int currentMonth = vipTierService.countVipCustomersInMonth(YearMonth.now());
        int lastMonth = vipTierService.countVipCustomersInMonth(YearMonth.now().minusMonths(1));
        double growth = lastMonth == 0 ? 100 : ((currentMonth - lastMonth) / (double) lastMonth) * 100;
        return Map.of("currentMonth", currentMonth, "lastMonth", lastMonth, "growthPercent", Math.round(growth));
    }

    @GetMapping("/stats/revenue-growth")
    public Map<String, Object> getVipRevenueGrowth() {
        double thisYear = vipTierService.sumVipRevenueInYear(Year.now().getValue());
        double lastYear = vipTierService.sumVipRevenueInYear(Year.now().getValue() - 1);
        double growth = lastYear == 0 ? 100 : ((thisYear - lastYear) / lastYear) * 100;
        return Map.of("thisYear", thisYear, "lastYear", lastYear, "growthPercent", Math.round(growth));
    }

    @GetMapping("/stats/avg-order-value")
    public Map<String, Object> getAvgOrderValueComparison() {
        double vipAvg = vipTierService.getVipAvgOrderValue();
        double regularAvg = vipTierService.getRegularAvgOrderValue();
        double diff = regularAvg == 0 ? 100 : ((vipAvg - regularAvg) / regularAvg) * 100;
        return Map.of("vipAvg", vipAvg, "regularAvg", regularAvg, "diffPercent", Math.round(diff));
    }

    @GetMapping("/stats/loyalty-score-growth")
    public Map<String, Object> getLoyaltyScoreGrowth() {
        Map<String, Object> result = vipTierService.getLoyaltyScoreGrowth();
        return result;
    }
} 