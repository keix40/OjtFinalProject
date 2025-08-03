package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.CouponApplyRequest;
import com.Ojt.Ecommerce.dto.CouponApplyResponse;
import com.Ojt.Ecommerce.dto.DiscountEventResponseDTO;
import com.Ojt.Ecommerce.dto.DiscountRequestDTO;
import com.Ojt.Ecommerce.dto.UserCouponDTO;
import com.Ojt.Ecommerce.entity.*;
import com.Ojt.Ecommerce.exception.CustomException;
import com.Ojt.Ecommerce.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.repository.VipTierRepository;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class DiscountCouponService {

    private final DiscountRepository discountRepository;
    private final ProductRepository productRepository;
    private final ProductDiscountRepository productDiscountRepository;
    private final DiscountRuleRepository discountRuleRepository;
    private final UserCouponUsageRepository userCouponUsageRepository;
    private final UserRepository userRepository;
    private final VipTierRepository vipTierRepository;
    private final DiscountRuleService discountRuleService;
    private final NotificationService notificationService;


    @Transactional
    public DiscountEventResponseDTO createDiscount(DiscountRequestDTO dto) {
        double discountValue;

        // Convert percentage to decimal format for storage
        if ("PERCENTAGE".equalsIgnoreCase(dto.getDiscountType())) {
            // Convert percentage to decimal (e.g., 1% -> 0.01, 10% -> 0.10)
            discountValue = dto.getDiscount_percent() / 100.0;
        } else {
            // Fixed amount remains unchanged
            discountValue = dto.getDiscount_amount();
        }

        Discount discount = Discount.builder()
                .name(dto.getName())
                .code(dto.getCode())
                .discountType(DiscountType.valueOf(dto.getDiscountType()))
                .discountValue(discountValue)
                .description(dto.getDescription())
                .startDate(dto.getStartDate().toLocalDate())
                .endDate(dto.getEndDate().toLocalDate())
                .autoApply(false)
                .minimumSpend(dto.getMinimumSpend())
                .status(dto.isStatus())
                .build();
        System.out.println("status saved:" + discount.isStatus());
        // Link to discount event if provided
        Discount saved = discountRepository.save(discount);

        if (dto.getUserIdsforCoupon() != null && !dto.getUserIdsforCoupon().isEmpty()) {
            discountRuleService.createUserDiscountRules(dto.getUserIdsforCoupon(), saved);
        } else if (dto.getVipTierIdsforCoupon() != null && !dto.getVipTierIdsforCoupon().isEmpty()) {
            discountRuleService.createVipTierDiscountRules(dto.getVipTierIdsforCoupon(), saved);
        } else if (dto.getProductIdsforCoupon() != null && !dto.getProductIdsforCoupon().isEmpty()) {
            List<DiscountRule> rules = dto.getProductIdsforCoupon().stream().map(productId -> {
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Product not found: " + productId));
                DiscountRule rule = new DiscountRule();
                rule.setDiscount(saved);
                rule.setTargetType(DiscountEventEnum.PRODUCT);
                rule.setProduct(product);
                return rule;
            }).toList();
            discountRuleRepository.saveAll(rules);
        } else {
            discountRuleService.createGlobalDiscountRule(saved);
        }

        // Send admin notification for discount creation
        sendAdminNotificationForDiscountCreation(dto, saved.getId());

        return mapToDTO(saved, dto.getProductIdsforCoupon());
    }

    public DiscountEventResponseDTO getDiscount(Long id) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Discount not found"));

        List<Long> productIds = discount.getDiscountRules().stream()
                .filter(pd -> pd.getProduct() != null)
                .map(pd -> pd.getProduct().getId())
                .toList();

        return mapToDTO(discount, productIds);
    }

    public List<DiscountEventResponseDTO> getAllDiscounts() {
        return discountRepository.findAll().stream()
                .map(discount -> {
                    List<Long> productIds = discount.getDiscountRules().stream()
                            .filter(pd -> pd.getProduct() != null)
                            .map(pd -> pd.getProduct().getId())
                            .toList();
                    return mapToDTO(discount, productIds);
                }).toList();
    }

    @Transactional
    public DiscountEventResponseDTO updateDiscount(Long id, DiscountRequestDTO dto) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Discount not found"));

        // Update discount fields
        discount.setName(dto.getName());
        discount.setCode(dto.getCode());
        discount.setDiscountType(dto.getDiscountTypeForCoupon());
        discount.setDiscountValue(dto.getDiscountValue());
        discount.setStartDate(dto.getStartDate().toLocalDate());
        discount.setEndDate(dto.getEndDate().toLocalDate());
        discount.setAutoApply(dto.getAutoApply());
        discount.setStatus(dto.isStatus());
        // Remove old product-discount links (ProductDiscount)
        discountRuleRepository.deleteAllByDiscount(discount); // You must define this method

        // Re-assign new product links
        if (dto.getProductIdsforCoupon() != null && !dto.getProductIdsforCoupon().isEmpty()) {
            List<ProductDiscount> links = dto.getProductIdsforCoupon().stream().map(productId -> {
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Product not found: " + productId));
                return ProductDiscount.builder()
                        .product(product)
                        .discount(discount)
                        .build();
            }).toList();

            productDiscountRepository.saveAll(links);
        }

        return mapToDTO(discount, dto.getProductIdsforCoupon());
    }


    @Transactional
    public void deleteDiscount(Long id) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Discount not found"));
        discount.setStatus(false); // soft delete
        discountRepository.save(discount);
    }

    public CouponApplyResponse validateCoupon(CouponApplyRequest request) {
        Discount discount = discountRepository.findByCode(request.getCouponCode())
                .orElseThrow(() -> new CustomException("Invalid Promo code"));

        LocalDate today = LocalDate.now();
        if (today.isBefore(discount.getStartDate()) || today.isAfter(discount.getEndDate())) {
            return new CouponApplyResponse(false, "Promo code expired", 0.0,null, null,null);
        }

        if (!discount.isStatus()) {
            return new CouponApplyResponse(false, "Invalid Promo code", 0.0,null, null,null);
        }

        // Check if already used
        boolean alreadyUsed = userCouponUsageRepository
                .existsByUserIdAndDiscountId(request.getUserId(), discount.getId());
        if (alreadyUsed) {
            return new CouponApplyResponse(false, "Promo code already used", 0.0,null, null,null);
        }

        // Check user/vip eligibility with hierarchical tier system
        List<DiscountRule> rules = discount.getDiscountRules();
        Long requestingUserId = request.getUserId();
        Long requestingUserVipTierId = request.getVipTierId();
        
        if (rules.stream().anyMatch(r -> r.getUser() != null)) {
            // Check specific user eligibility
            if (!rules.stream().anyMatch(r -> Objects.equals(r.getUser().getId(), requestingUserId))) {
                return new CouponApplyResponse(false, "Invalid Promo code", 0.0, null, null,null);
            }
        } else if (rules.stream().anyMatch(r -> r.getVipTier() != null)) {
            // Check VIP tier eligibility with hierarchical system
            boolean isEligible = false;
            
            // Get user and determine their VIP tier based on total points
            User user = userRepository.findById(requestingUserId).orElse(null);
            if (user == null) {
                return new CouponApplyResponse(false, "User not found", 0.0, null, null,null);
            }
            
            // Get user's total points
            Integer userTotalPoints = user.getTotalPoints() != null ? user.getTotalPoints() : 0;
            
            // Find the highest VIP tier the user qualifies for based on points
            VipTier userVipTier = determineUserVipTier(userTotalPoints);
            
            // If user has no VIP tier, treat as Regular (lowest tier)
            int userTierLevel = (userVipTier != null) ? userVipTier.getTierLevel(userVipTier.getName()) : 1;

            System.out.println("=== VIP TIER VALIDATION DEBUG ===");
            System.out.println("User Total Points: " + userTotalPoints);
            System.out.println("User VIP Tier: " + (userVipTier != null ? userVipTier.getName() : "Regular"));
            System.out.println("User Tier Level: " + userTierLevel);
            
            // Check each VIP tier rule
            for (DiscountRule rule : rules) {
                if (rule.getVipTier() != null) {
                    VipTier couponVipTier = rule.getVipTier();
                    int couponTierLevel = couponVipTier.getTierLevel(couponVipTier.getName());
                    
                    System.out.println("Coupon VIP Tier: " + couponVipTier.getName());
                    System.out.println("Coupon Tier Level: " + couponTierLevel);
                    System.out.println("User can use this coupon: " + (userTierLevel >= couponTierLevel));
                    
                    // Hierarchical rule: User can use coupon if their tier level >= coupon tier level
                    if (userTierLevel >= couponTierLevel) {
                        isEligible = true;
                        break;
                    }
                }
            }
            
            System.out.println("Final eligibility: " + isEligible);
            System.out.println("================================");
            
            if (!isEligible) {
                String userTierName = (userVipTier != null) ? userVipTier.getName() : "Regular";
                String requiredTierName = rules.stream()
                    .filter(r -> r.getVipTier() != null)
                    .map(r -> r.getVipTier().getName())
                    .findFirst()
                    .orElse("Unknown");
                
                return new CouponApplyResponse(false, 
                    "This coupon is only available for " + requiredTierName + " tier and above. Your current tier: " + userTierName + " (Points: " + userTotalPoints + ")", 
                    0.0, null, null,null);
            }
        }
        // else: applies to all users

        // Check if coupon is linked to specific products
        List<DiscountRule> productDiscounts = discount.getDiscountRules();
        if (!productDiscounts.isEmpty() && request.getProductIds() != null) {
            boolean matches = productDiscounts.stream()
                    .anyMatch(pd -> pd.getProduct() != null && request.getProductIds().contains(pd.getProduct().getId()));
            if (!matches) {
                return new CouponApplyResponse(false, "Invalid Promo code", 0.0, null, null,null);
            }
        }

        // Convert discount value for frontend display
        double discountValueForFrontend;
        if (discount.getDiscountType() == DiscountType.PERCENTAGE) {
            // Convert decimal to percentage (e.g., 0.10 -> 10.0)
            discountValueForFrontend = discount.getDiscountValue() * 100.0;
        } else {
            // Fixed amount remains unchanged
            discountValueForFrontend = discount.getDiscountValue();
        }

        return new CouponApplyResponse(
                true,
                "Coupon is valid",
                discountValueForFrontend,
                discount.getName(), // couponName
                discount.getDiscountType().name(), // discountType
                discount.getId()
        );
    }

    // Utility method to determine user's VIP tier based on total points
    private VipTier determineUserVipTier(Integer userTotalPoints) {
        if (userTotalPoints == null) {
            userTotalPoints = 0;
        }
        
        List<VipTier> allVipTiers = vipTierRepository.findAll();
        
        // Sort VIP tiers by minimum points (ascending) to find the highest tier user qualifies for
        allVipTiers.sort((t1, t2) -> Integer.compare(t1.getMinPoints(), t2.getMinPoints()));
        
        VipTier highestQualifyingTier = null;
        for (VipTier tier : allVipTiers) {
            if (userTotalPoints >= tier.getMinPoints()) {
                highestQualifyingTier = tier;
            } else {
                break; // Stop when we find a tier user doesn't qualify for
            }
        }
        
        return highestQualifyingTier; // Returns null if user doesn't qualify for any tier (treat as Regular)
    }

    public List<UserCouponDTO> getUserCoupons(Long userId) {
        // Get user and their VIP tier
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        VipTier userVipTier = determineUserVipTier(user.getTotalPoints());
        Integer userTotalPoints = user.getTotalPoints() != null ? user.getTotalPoints() : 0;
        
        // Get all coupons (autoApply = false) - including inactive ones
        List<Discount> allCoupons = discountRepository.findByAutoApplyFalse();
        
        // Filter coupons based on eligibility and add status information
        return allCoupons.stream()
                .filter(coupon -> {
                    // Check eligibility based on discount rules
                    List<DiscountRule> rules = coupon.getDiscountRules();
                    
                    // If no rules, coupon is for everyone
                    if (rules == null || rules.isEmpty()) {
                        return true;
                    }
                    
                    // Check if coupon is for specific users
                    boolean hasUserRules = rules.stream().anyMatch(r -> r.getUser() != null);
                    if (hasUserRules) {
                        return rules.stream().anyMatch(r -> r.getUser() != null && 
                                Objects.equals(r.getUser().getId(), userId));
                    }
                    
                    // Check if coupon is for VIP tiers
                    boolean hasVipTierRules = rules.stream().anyMatch(r -> r.getVipTier() != null);
                    if (hasVipTierRules) {
                        // User can use coupon if their tier level >= coupon tier level
                        int userTierLevel = (userVipTier != null) ? userVipTier.getTierLevel(userVipTier.getName()) : 1;
                        
                        return rules.stream().anyMatch(r -> {
                            if (r.getVipTier() != null) {
                                VipTier couponVipTier = r.getVipTier();
                                int couponTierLevel = couponVipTier.getTierLevel(couponVipTier.getName());
                                return userTierLevel >= couponTierLevel;
                            }
                            return false;
                        });
                    }
                    
                    // If no specific rules, coupon is for everyone
                    return true;
                })
                .map(coupon -> mapToUserCouponDTO(coupon, userId))
                .toList();
    }

    private UserCouponDTO mapToUserCouponDTO(Discount coupon, Long userId) {
        UserCouponDTO dto = new UserCouponDTO();
        dto.setId(coupon.getId());
        dto.setName(coupon.getName());
        dto.setDescription(coupon.getDescription());
        dto.setCode(coupon.getCode());
        dto.setDiscountType(coupon.getDiscountType().toString());
        
        // Convert decimal to percentage for display
        if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
            double percentageValue = coupon.getDiscountValue() * 100.0;
            dto.setDiscountValue(percentageValue);
        } else {
            dto.setDiscountValue(coupon.getDiscountValue());
        }
        
        dto.setStartDate(coupon.getStartDate());
        dto.setEndDate(coupon.getEndDate());
        dto.setStatus(coupon.isStatus());
        dto.setAutoApply(coupon.getAutoApply());
        dto.setMinimumSpend(coupon.getMinimumSpend());
        
        // Determine coupon status
        LocalDate today = LocalDate.now();
        boolean alreadyUsed = userCouponUsageRepository.existsByUserIdAndDiscountId(userId, coupon.getId());
        
        if (alreadyUsed) {
            dto.setCouponStatus("ALREADY_USED");
            dto.setCanUse(false);
            dto.setStatusMessage("Already used");
        } else if (today.isBefore(coupon.getStartDate())) {
            dto.setCouponStatus("NOT_STARTED");
            dto.setCanUse(false);
            dto.setStatusMessage("Not started yet");
        } else if (today.isAfter(coupon.getEndDate())) {
            dto.setCouponStatus("EXPIRED");
            dto.setCanUse(false);
            dto.setStatusMessage("Expired");
        } else if (!coupon.isStatus()) {
            dto.setCouponStatus("INACTIVE");
            dto.setCanUse(false);
            dto.setStatusMessage("Inactive");
        } else {
            dto.setCouponStatus("ACTIVE");
            dto.setCanUse(true);
            dto.setStatusMessage("Available");
        }
        
        return dto;
    }

    private DiscountEventResponseDTO mapToDTO(Discount discount, List<Long> productIds) {
        DiscountEventResponseDTO dto = new DiscountEventResponseDTO();
        dto.setId(discount.getId());
        dto.setName(discount.getName());
        dto.setCode(discount.getCode());
        dto.setDiscountType(discount.getDiscountType());
        
        // Convert stored decimal percentage back to percentage format for display
        if (discount.getDiscountType() == DiscountType.PERCENTAGE) {
            double percentageValue = discount.getDiscountValue() * 100.0;
            dto.setDiscountValue(percentageValue);
        } else {
        dto.setDiscountValue(discount.getDiscountValue());
        }
        
        dto.setStartDate(discount.getStartDate().toString());
        dto.setEndDate(discount.getEndDate().toString());
        dto.setAutoApply(discount.getAutoApply());
        dto.setDiscountId(discount.getDiscountEvent() != null
                ? discount.getDiscountEvent().getId()
                : null);
        dto.setProductIds(productIds);
        return dto;
    }

    /**
     * Send notification to admin when a new discount is created
     */
    private void sendAdminNotificationForDiscountCreation(DiscountRequestDTO dto, Long discountId) {
        try {
            String discountValueText;
            if ("PERCENTAGE".equalsIgnoreCase(dto.getDiscountType())) {
                double percent = dto.getDiscount_percent();
                discountValueText = percent + "% off";
            } else {
                discountValueText = dto.getDiscount_amount() + " MMK off";
            }

            String notificationMessage = "🎯 New discount created: \"" + dto.getName() + "\" - " + discountValueText + 
                                      " | Target: " + dto.getTargetType() + " | Duration: " + 
                                      dto.getStartDate().toLocalDate() + " to " + dto.getEndDate().toLocalDate();
            
            String type = "create";
            String category = "discount";
            String link = "/admin/discount-management";

           // notificationService.sendNotificationToAdmin(notificationMessage, category, type, link);
            
            System.out.println("[DiscountCouponService] Admin notification sent for discount: " + dto.getName());
        } catch (Exception e) {
            System.err.println("[DiscountCouponService] Failed to send admin notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
