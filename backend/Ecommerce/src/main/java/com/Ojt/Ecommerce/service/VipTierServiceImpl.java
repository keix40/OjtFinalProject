package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.VipTier;
import com.Ojt.Ecommerce.repository.VipTierRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import com.Ojt.Ecommerce.entity.UserStatus;

@Service
@RequiredArgsConstructor
public class VipTierServiceImpl implements VipTierService {
    private final VipTierRepository vipTierRepository;

    @Autowired
    private UserRepository userRepository;
    // You may need to @Autowired OrderRepository if you have one

    @Override
    public List<VipTier> getAllTiers() {
        return vipTierRepository.findAll();
    }

    @Override
    public VipTier getTierById(Long id) {
        return vipTierRepository.findById(id).orElse(null);
    }

    @Override
    public VipTier createTier(VipTier tier) {
        return vipTierRepository.save(tier);
    }

    @Override
    public VipTier updateTier(Long id, VipTier tier) {
        tier.setId(id);
        return vipTierRepository.save(tier);
    }

    @Override
    public void deleteTier(Long id) {
        vipTierRepository.deleteById(id);
    }

    @Override
    public int countVipCustomersInMonth(YearMonth month) {
        LocalDateTime start = month.atDay(1).atStartOfDay();
        LocalDateTime end = month.atEndOfMonth().atTime(23, 59, 59);
        // Example: count users with VIP tier and createdDate in range
        return (int) userRepository.findAll().stream()
            .filter(u -> u.getRole() != null && u.getRole().getName().equalsIgnoreCase("CUSTOMER"))
            .filter(u -> u.getTier() != null && !u.getTier().equalsIgnoreCase("Regular"))
            .filter(u -> u.getCreatedDate() != null &&
                !u.getCreatedDate().isBefore(start) && !u.getCreatedDate().isAfter(end))
            .count();
    }

    @Override
    public double sumVipRevenueInYear(int year) {
        // Example: sum totalSpent for VIP customers in the given year
        return userRepository.findAll().stream()
            .filter(u -> u.getRole() != null && u.getRole().getName().equalsIgnoreCase("CUSTOMER"))
            .filter(u -> u.getTier() != null && !u.getTier().equalsIgnoreCase("Regular"))
            .filter(u -> u.getOrders() != null)
            .flatMap(u -> u.getOrders().stream())
            .filter(o -> o.getOrderDate() != null && o.getOrderDate().getYear() == year)
            .flatMap(o -> o.getOrderProducts().stream())
            .mapToDouble(op -> op.getUnitPrice() != null && op.getQuantity() != null ? op.getUnitPrice() * op.getQuantity() : 0)
            .sum();
    }

    @Override
    public double getVipAvgOrderValue() {
        List<User> vips = userRepository.findAll().stream()
            .filter(u -> u.getRole() != null && u.getRole().getName().equalsIgnoreCase("CUSTOMER"))
            .filter(u -> u.getTier() != null && !u.getTier().equalsIgnoreCase("Regular"))
            .toList();
        double total = vips.stream().mapToDouble(u -> {
            if (u.getOrders() == null) return 0;
            return u.getOrders().stream().flatMap(o -> o.getOrderProducts().stream())
                .mapToDouble(op -> op.getUnitPrice() != null && op.getQuantity() != null ? op.getUnitPrice() * op.getQuantity() : 0).sum();
        }).sum();
        int orders = vips.stream().mapToInt(u -> u.getOrders() != null ? u.getOrders().size() : 0).sum();
        return orders == 0 ? 0 : total / orders;
    }

    @Override
    public double getRegularAvgOrderValue() {
        List<User> regs = userRepository.findAll().stream()
            .filter(u -> u.getRole() != null && u.getRole().getName().equalsIgnoreCase("CUSTOMER"))
            .filter(u -> u.getTier() == null || u.getTier().equalsIgnoreCase("Regular"))
            .toList();
        double total = regs.stream().mapToDouble(u -> {
            if (u.getOrders() == null) return 0;
            return u.getOrders().stream().flatMap(o -> o.getOrderProducts().stream())
                .mapToDouble(op -> op.getUnitPrice() != null && op.getQuantity() != null ? op.getUnitPrice() * op.getQuantity() : 0).sum();
        }).sum();
        int orders = regs.stream().mapToInt(u -> u.getOrders() != null ? u.getOrders().size() : 0).sum();
        return orders == 0 ? 0 : total / orders;
    }

    @Override
    public Map<String, Object> getLoyaltyScoreGrowth() {
        List<User> allCustomers = userRepository.findAll().stream()
            .filter(u -> u.getRole() != null && u.getRole().getName().equalsIgnoreCase("CUSTOMER"))
            .toList();
        // Current quarter
        LocalDate now = LocalDate.now();
        int currentQuarter = (now.getMonthValue() - 1) / 3 + 1;
        int currentYear = now.getYear();
        // Previous quarter
        int prevQuarter = currentQuarter - 1;
        int prevYear = currentYear;
        if (prevQuarter == 0) {
            prevQuarter = 4;
            prevYear--;
        }
        final int prevQuarterFinal = prevQuarter;
        final int prevYearFinal = prevYear;
        // Helper to get quarter from date
        java.util.function.Function<LocalDateTime, Integer> getQuarter = (date) -> (date.getMonthValue() - 1) / 3 + 1;
        // Customers from previous quarter
        List<User> prevQuarterCustomers = allCustomers.stream()
            .filter(c -> {
                if (c.getOrders() == null || c.getOrders().isEmpty()) return false;
                LocalDateTime lastOrder = c.getOrders().stream()
                    .map(o -> o.getOrderDate())
                    .filter(d -> d != null)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);
                if (lastOrder == null) return false;
                return lastOrder.getYear() == prevYearFinal && getQuarter.apply(lastOrder) == prevQuarterFinal;
            })
            .toList();
        // Loyalty score calculation (same as frontend)
        int currScore = calculateLoyaltyScore(allCustomers);
        int prevScore = calculateLoyaltyScore(prevQuarterCustomers);
        Integer growth;
        if (prevScore == 0) {
            if (currScore > 0) {
                growth = 100;
            } else {
                growth = 0;
            }
        } else {
            growth = Math.round(((currScore - prevScore) / (float) prevScore) * 100);
        }
        return Map.of(
            "currentQuarterScore", currScore,
            "previousQuarterScore", prevScore,
            "growthPercent", growth
        );
    }

    private int calculateLoyaltyScore(List<User> customers) {
        if (customers == null || customers.isEmpty()) return 0;
        double totalScore = 0;
        double maxPossibleScore = 0;
        // Factor 1: Active customers (30% weight)
        long activeCustomersCount = customers.stream().filter(c -> c.getStatus() == UserStatus.ACTIVE && getTotalOrders(c) > 0).count();
        double activeCustomerScore = ((double) activeCustomersCount / customers.size()) * 30;
        totalScore += activeCustomerScore;
        maxPossibleScore += 30;
        // Factor 2: VIP Tier distribution (25% weight)
        Map<String, Integer> tierScores = new java.util.HashMap<>();
        vipTierRepository.findAll().forEach(tier -> tierScores.put(tier.getName(), tier.getWeight() != null ? tier.getWeight() : 5));
        Map<String, Long> tierDistribution = customers.stream().collect(java.util.stream.Collectors.groupingBy(
            User::getTier, java.util.stream.Collectors.counting()));
        double tierScore = 0;
        for (var entry : tierDistribution.entrySet()) {
            int tierWeight = tierScores.getOrDefault(entry.getKey(), 5);
            tierScore += ((double) entry.getValue() / customers.size()) * tierWeight;
        }
        totalScore += tierScore;
        maxPossibleScore += 25;
        // Factor 3: Average order value (20% weight)
        double totalSpent = customers.stream().mapToDouble(this::getTotalSpent).sum();
        int totalOrders = customers.stream().mapToInt(this::getTotalOrders).sum();
        double avgOrderValue = totalOrders == 0 ? 0 : totalSpent / totalOrders;
        double orderValueScore = Math.min((avgOrderValue / 100000) * 20, 20);
        totalScore += orderValueScore;
        maxPossibleScore += 20;
        // Factor 4: Customer retention (15% weight)
        long customersWithMultipleOrders = customers.stream().filter(c -> getTotalOrders(c) > 1).count();
        double retentionScore = ((double) customersWithMultipleOrders / customers.size()) * 15;
        totalScore += retentionScore;
        maxPossibleScore += 15;
        // Factor 5: Recent activity (10% weight)
        long recentCustomers = customers.stream().filter(c -> {
            LocalDateTime lastOrderDate = c.getOrders() == null ? null : c.getOrders().stream()
                .map(o -> o.getOrderDate())
                .filter(d -> d != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);
            if (lastOrderDate == null) return false;
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
            return lastOrderDate.isAfter(thirtyDaysAgo);
        }).count();
        double recentActivityScore = ((double) recentCustomers / customers.size()) * 10;
        totalScore += recentActivityScore;
        maxPossibleScore += 10;
        return (int) Math.round((totalScore / maxPossibleScore) * 100);
    }

    private int getTotalOrders(User user) {
        return user.getOrders() == null ? 0 : user.getOrders().size();
    }
    private double getTotalSpent(User user) {
        if (user.getOrders() == null) return 0;
        return user.getOrders().stream().flatMap(o -> o.getOrderProducts().stream())
            .mapToDouble(op -> op.getUnitPrice() != null && op.getQuantity() != null ? op.getUnitPrice() * op.getQuantity() : 0).sum();
    }
} 