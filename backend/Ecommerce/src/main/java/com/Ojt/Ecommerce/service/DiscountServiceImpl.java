package com.Ojt.Ecommerce.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.Ojt.Ecommerce.entity.*;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.Ojt.Ecommerce.dto.DiscountDTO;
import com.Ojt.Ecommerce.dto.DiscountRequestDTO;
import com.Ojt.Ecommerce.repository.BrandRepository;
import com.Ojt.Ecommerce.repository.CategoryRepository;
import com.Ojt.Ecommerce.repository.DiscountRepository;
import com.Ojt.Ecommerce.repository.DiscountRuleRepository;
import com.Ojt.Ecommerce.repository.ProductRepository;
import com.Ojt.Ecommerce.repository.UserCouponUsageRepository;
import com.Ojt.Ecommerce.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiscountServiceImpl implements DiscountService {
    private final DiscountRepository discountRepository;
    private final DiscountRuleRepository discountRuleRepository;
    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final UserCouponUsageRepository userCouponUsageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final DiscountRuleService discountRuleService;

    @Override
    public ResponseEntity<?> createDiscount(DiscountRequestDTO dto) {
        try {
            // Only create Discount, no DiscountEvent
            Discount discount = createDiscounts(dto);
            System.out.println("[DiscountService] About to create discount rules.");
            discountRuleService.createDiscountRules(dto, discount);
            System.out.println("[DiscountService] Finished creating discount rules.");
            sendDiscountNotificationToAllUsers(dto,discount.getId());
            return ResponseEntity.ok(Map.of("message", "Discount created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // New method to create discount with conflict resolution
    public ResponseEntity<?> createDiscountWithResolution(DiscountRequestDTO dto, String resolutionChoice) {
        try {
            Discount discount = createDiscounts(dto);

            // Handle conflict resolution
            if ("OVERWRITE".equals(resolutionChoice)) {
                // Remove existing conflicting discounts before creating new ones
                removeConflictingDiscounts(dto);
            }

            discountRuleService.createDiscountRules(dto, discount);
            sendDiscountNotificationToAllUsers(dto,discount.getId());
            return ResponseEntity.ok(Map.of("message", "Discount created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public ResponseEntity<?> createDiscountWithResolution(DiscountRequestDTO dto, List<List<String>> conflictResolutions) {
        try {
            Discount discount = createDiscounts(dto);

            // If conflictResolutions is null or empty, just create rules (no overwrite)
            if (conflictResolutions == null || conflictResolutions.isEmpty()) {
                discountRuleService.createDiscountRules(dto, discount);
                sendDiscountNotificationToAllUsers(dto, discount.getId());
                return ResponseEntity.ok(Map.of("message", "Discount created successfully"));
            }

            // Remove only the selected conflicts
            for (List<String> entry : conflictResolutions) {
                if (entry.size() == 2 && "OVERWRITE".equals(entry.get(1))) {
                    // entry[0] is targetId, entry[1] is resolution
                    String targetId = entry.get(0);
                    String targetType = dto.getTargetType(); // Use the current targetType from DTO
                    removeConflictingDiscountByTarget(targetType, targetId);
                }
            }

            discountRuleService.createDiscountRules(dto, discount);
            sendDiscountNotificationToAllUsers(dto, discount.getId());
            return ResponseEntity.ok(Map.of("message", "Discount created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Method to remove conflicting discounts when user chooses to overwrite
    private void removeConflictingDiscounts(DiscountRequestDTO dto) {
        String targetType = dto.getTargetType().toUpperCase();
        System.out.println("[Discount] removeConflictingDiscounts called for targetType: " + targetType + ", DTO: " + dto);

        // For user-specific discounts, "overwrite" means removing any old user-specific discounts for that target,
        // not removing the general discounts they conflict with.
        if (targetType.startsWith("USER_")) {
            switch (targetType) {
                case "USER_BRAND":
                    if (dto.getUserIds() != null && !dto.getUserIds().trim().isEmpty() && dto.getBrandIds() != null && !dto.getBrandIds().trim().isEmpty()) {
                        String[] userIds = dto.getUserIds().split(",");
                        String[] brandIds = dto.getBrandIds().split(",");
                        for (String userIdStr : userIds) {
                            for (String brandIdStr : brandIds) {
                                discountRuleRepository.deleteByUserIdAndBrandId(Long.parseLong(userIdStr.trim()), Long.parseLong(brandIdStr.trim()));
                            }
                        }
                    }
                    break;
                case "USER_CATEGORY":
                    if (dto.getUserIds() != null && !dto.getUserIds().trim().isEmpty() && dto.getCategoryIds() != null && !dto.getCategoryIds().trim().isEmpty()) {
                        String[] userIds = dto.getUserIds().split(",");
                        String[] categoryIds = dto.getCategoryIds().split(",");
                        for (String userIdStr : userIds) {
                            for (String categoryIdStr : categoryIds) {
                                discountRuleRepository.deleteByUserIdAndCategoryId(Long.parseLong(userIdStr.trim()), Long.parseLong(categoryIdStr.trim()));
                            }
                        }
                    }
                    break;
                case "USER_BRAND_CATEGORY":
                    if (dto.getUserIds() != null && !dto.getUserIds().trim().isEmpty() && dto.getBrandCategoryIds() != null && !dto.getBrandCategoryIds().trim().isEmpty()) {
                        String[] userIds = dto.getUserIds().split(",");
                        String[] brandCategoryIds = dto.getBrandCategoryIds().split(",");
                        for (String userIdStr : userIds) {
                            for (String brandCategoryIdStr : brandCategoryIds) {
                                String[] parts = brandCategoryIdStr.trim().split("-");
                                if (parts.length == 2) {
                                    Long brandId = Long.parseLong(parts[0]);
                                    Long categoryId = Long.parseLong(parts[1]);
                                    discountRuleRepository.deleteByUserIdAndBrandIdAndCategoryId(Long.parseLong(userIdStr.trim()), brandId, categoryId);
                                }
                            }
                        }
                    }
                    break;
                case "USER_PRODUCT":
                    if (dto.getUserIds() != null && !dto.getUserIds().trim().isEmpty() && dto.getProductIds() != null && !dto.getProductIds().trim().isEmpty()) {
                        String[] userIds = dto.getUserIds().split(",");
                        String[] productIds = dto.getProductIds().split(",");
                        for (String userIdStr : userIds) {
                            for (String productIdStr : productIds) {
                                discountRuleRepository.deleteByUserIdAndProductId(Long.parseLong(userIdStr.trim()), Long.parseLong(productIdStr.trim()));
                            }
                        }
                    }
                    break;
            }
            return; // IMPORTANT: Stop here for user-specific discounts. Do not proceed to general discount removal.
        }


        switch (targetType) {
            case "CATEGORY":
                if (dto.getCategoryIds() != null && !dto.getCategoryIds().trim().isEmpty()) {
                    String[] categoryIds = dto.getCategoryIds().split(",");
                    for (String categoryIdStr : categoryIds) {
                        Long categoryId = Long.parseLong(categoryIdStr.trim());
                        System.out.println("[Discount] Removing conflicts for CATEGORY id: " + categoryId);
                        removeConflictingCategoryDiscounts(categoryId);
                        List<Brand> brands = brandRepository.findAllBrandByCateId(categoryId);
                        for (Brand brand : brands) {
                            System.out.println("[Discount] Handling partial overwrite for brandId: " + brand.getId() + " and categoryId: " + categoryId);
                            // 1. Find the brand discount rule for this brand
                            List<DiscountRule> brandRules = discountRuleRepository.findByBrandIdAndDiscountStatusTrue(brand.getId());
                            for (DiscountRule brandRule : brandRules) {
                                if (brandRule.getTargetType() == DiscountEventEnum.BRAND) {
                                    Discount discount = brandRule.getDiscount();
                                    // 2. Remove the brand discount rule
                                    System.out.println("[Discount] Deleting BRAND DiscountRule id: " + brandRule.getId() + " for brandId: " + brand.getId() + " (partial overwrite)");
                                    discountRuleRepository.delete(brandRule);
                                    // 3. For all products of this brand NOT in the overwritten category, create product-level rules with the same discount
                                    List<Product> unaffectedProducts = productRepository.findByBrandId(brand.getId());
                                    for (Product product : unaffectedProducts) {
                                        boolean isInCategory = product.getProductCategories().stream()
                                                .anyMatch(phc -> phc.getCategory() != null && phc.getCategory().getId().equals(categoryId));
                                        if (!isInCategory) {
                                            // Check if a product-level rule already exists for this discount and product
                                            List<DiscountRule> existingProductRules = discountRuleRepository.findByProductIdAndDiscountStatusTrue(product.getId());
                                            boolean hasProductRule = existingProductRules.stream().anyMatch(r -> r.getDiscount().getId().equals(discount.getId()) && r.getTargetType() == DiscountEventEnum.PRODUCT);
                                            if (!hasProductRule) {
                                                DiscountRule newRule = new DiscountRule();
                                                newRule.setTargetType(DiscountEventEnum.PRODUCT);
                                                newRule.setDiscount(discount);
                                                newRule.setProduct(product);
                                                discountRuleRepository.save(newRule);
                                                System.out.println("[Discount] Created PRODUCT DiscountRule for productId: " + product.getId() + " (brand partial overwrite)");
                                            }
                                        }
                                    }
                                }
                            }
                            // Remove brand-category discounts for this brand and category
                            removeConflictingBrandCategoryDiscounts(brand.getId(), categoryId);
                            // Remove brand discount only for products in this brand and category
                            removeBrandDiscountForBrandAndCategory(brand.getId(), categoryId);
                        }
                    }
                }
                break;
            case "BRAND":
                if (dto.getBrandIds() != null && !dto.getBrandIds().trim().isEmpty()) {
                    String[] brandIds = dto.getBrandIds().split(",");
                    for (String brandIdStr : brandIds) {
                        Long brandId = Long.parseLong(brandIdStr.trim());
                        System.out.println("[Discount] Removing conflicts for BRAND id: " + brandId);
                        removeConflictingBrandDiscounts(brandId);
                        // Remove ALL brand-category discounts for this brand to allow brand discount to take precedence
                        List<Category> categories = categoryRepository.findAllCategoryByBrandId(brandId);
                        for (Category category : categories) {
                            System.out.println("[Discount] Removing BRAND_CATEGORY conflicts for brandId: " + brandId + " and categoryId: " + category.getId());
                            removeConflictingBrandCategoryDiscounts(brandId, category.getId());
                            // Enhanced: Handle category-level discount for this category
                            List<DiscountRule> categoryRules = discountRuleRepository.findByCategoryIdAndDiscountStatusTrue(category.getId());
                            for (DiscountRule categoryRule : categoryRules) {
                                if (categoryRule.getTargetType() == DiscountEventEnum.CATEGORY) {
                                    Discount discount = categoryRule.getDiscount();
                                    // Remove the category discount rule
                                    System.out.println("[Discount] Deleting CATEGORY DiscountRule id: " + categoryRule.getId() + " for categoryId: " + category.getId() + " (partial overwrite for brand)");
                                    discountRuleRepository.delete(categoryRule);
                                    // For all products in the category NOT in the overwritten brand, create product-level rules
                                    List<Product> categoryProducts = productRepository.findByCategoryId(category.getId());
                                    for (Product product : categoryProducts) {
                                        if (product.getBrand() != null && !product.getBrand().getId().equals(brandId)) {
                                            List<DiscountRule> existingProductRules = discountRuleRepository.findByProductIdAndDiscountStatusTrue(product.getId());
                                            boolean hasProductRule = existingProductRules.stream().anyMatch(r -> r.getDiscount().getId().equals(discount.getId()) && r.getTargetType() == DiscountEventEnum.PRODUCT);
                                            if (!hasProductRule) {
                                                DiscountRule newRule = new DiscountRule();
                                                newRule.setTargetType(DiscountEventEnum.PRODUCT);
                                                newRule.setDiscount(discount);
                                                newRule.setProduct(product);
                                                discountRuleRepository.save(newRule);
                                                System.out.println("[Discount] Created PRODUCT DiscountRule for productId: " + product.getId() + " (category partial overwrite for brand)");
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        // Remove category and brand-category discount rules for products in this brand
                        List<Product> brandProducts = productRepository.findByBrandId(brandId);
                        for (Product product : brandProducts) {
                            // Remove product-level category and brand-category discount rules
                            List<DiscountRule> rules = discountRuleRepository.findByProductIdAndDiscountStatusTrue(product.getId());
                            for (DiscountRule rule : rules) {
                                if (rule.getTargetType() == DiscountEventEnum.CATEGORY) {
                                    System.out.println("[Discount] Deleting CATEGORY DiscountRule id: " + rule.getId() + " for productId: " + product.getId() + " (brand overwrite)");
                                    discountRuleRepository.delete(rule);
                                }
                                if (rule.getTargetType() == DiscountEventEnum.BRAND_CATEGORY) {
                                    System.out.println("[Discount] Deleting BRAND_CATEGORY DiscountRule id: " + rule.getId() + " for productId: " + product.getId() + " (brand overwrite)");
                                    discountRuleRepository.delete(rule);
                                }
                            }
                        }
                    }
                }
                break;
            case "BRAND_CATEGORY":
                if (dto.getBrandCategoryIds() != null && !dto.getBrandCategoryIds().trim().isEmpty()) {
                    String[] brandCategoryIds = dto.getBrandCategoryIds().split(",");
                    for (String brandCategoryIdStr : brandCategoryIds) {
                        String[] parts = brandCategoryIdStr.trim().split("-");
                        if (parts.length == 2) {
                            Long brandId = Long.parseLong(parts[0]);
                            Long categoryId = Long.parseLong(parts[1]);
                            System.out.println("[Discount] Removing conflicts for BRAND_CATEGORY brandId: " + brandId + ", categoryId: " + categoryId);
                            // Only remove the specific brand-category combination
                            removeConflictingBrandCategoryDiscounts(brandId, categoryId);
                            // Remove brand discount only for products in this brand and category
                            removeBrandDiscountForBrandAndCategory(brandId, categoryId);
                            // Remove category discount only for products in this brand and category
                            removeCategoryDiscountForBrandAndCategory(brandId, categoryId);

                            // --- Enhanced logic for partial overwrite ---
                            // 1. Handle brand-level discount
                            List<DiscountRule> brandRules = discountRuleRepository.findByBrandIdAndDiscountStatusTrue(brandId);
                            for (DiscountRule brandRule : brandRules) {
                                if (brandRule.getTargetType() == DiscountEventEnum.BRAND) {
                                    Discount discount = brandRule.getDiscount();
                                    // Remove the brand discount rule
                                    System.out.println("[Discount] Deleting BRAND DiscountRule id: " + brandRule.getId() + " for brandId: " + brandId + " (partial overwrite for brand-category)");
                                    discountRuleRepository.delete(brandRule);
                                    // For all products in the brand NOT in the overwritten category, create product-level rules
                                    List<Product> brandProducts = productRepository.findByBrandId(brandId);
                                    for (Product product : brandProducts) {
                                        boolean isInCategory = product.getProductCategories().stream()
                                                .anyMatch(phc -> phc.getCategory() != null && phc.getCategory().getId().equals(categoryId));
                                        if (!isInCategory) {
                                            List<DiscountRule> existingProductRules = discountRuleRepository.findByProductIdAndDiscountStatusTrue(product.getId());
                                            boolean hasProductRule = existingProductRules.stream().anyMatch(r -> r.getDiscount().getId().equals(discount.getId()) && r.getTargetType() == DiscountEventEnum.PRODUCT);
                                            if (!hasProductRule) {
                                                DiscountRule newRule = new DiscountRule();
                                                newRule.setTargetType(DiscountEventEnum.PRODUCT);
                                                newRule.setDiscount(discount);
                                                newRule.setProduct(product);
                                                discountRuleRepository.save(newRule);
                                                System.out.println("[Discount] Created PRODUCT DiscountRule for productId: " + product.getId() + " (brand partial overwrite for brand-category)");
                                            }
                                        }
                                    }
                                }
                            }
                            // 2. Handle category-level discount
                            List<DiscountRule> categoryRules = discountRuleRepository.findByCategoryIdAndDiscountStatusTrue(categoryId);
                            for (DiscountRule categoryRule : categoryRules) {
                                if (categoryRule.getTargetType() == DiscountEventEnum.CATEGORY) {
                                    Discount discount = categoryRule.getDiscount();
                                    // Remove the category discount rule
                                    System.out.println("[Discount] Deleting CATEGORY DiscountRule id: " + categoryRule.getId() + " for categoryId: " + categoryId + " (partial overwrite for brand-category)");
                                    discountRuleRepository.delete(categoryRule);
                                    // For all products in the category NOT in the overwritten brand, create product-level rules
                                    List<Product> categoryProducts = productRepository.findByCategoryId(categoryId);
                                    for (Product product : categoryProducts) {
                                        if (product.getBrand() != null && !product.getBrand().getId().equals(brandId)) {
                                            List<DiscountRule> existingProductRules = discountRuleRepository.findByProductIdAndDiscountStatusTrue(product.getId());
                                            boolean hasProductRule = existingProductRules.stream().anyMatch(r -> r.getDiscount().getId().equals(discount.getId()) && r.getTargetType() == DiscountEventEnum.PRODUCT);
                                            if (!hasProductRule) {
                                                DiscountRule newRule = new DiscountRule();
                                                newRule.setTargetType(DiscountEventEnum.PRODUCT);
                                                newRule.setDiscount(discount);
                                                newRule.setProduct(product);
                                                discountRuleRepository.save(newRule);
                                                System.out.println("[Discount] Created PRODUCT DiscountRule for productId: " + product.getId() + " (category partial overwrite for brand-category)");
                                            }
                                        }
                                    }
                                }
                            }
                            // --- End enhanced logic ---
                        }
                    }
                }
                break;
            case "PRODUCT":
                if (dto.getProductIds() != null && !dto.getProductIds().trim().isEmpty()) {
                    String[] productIds = dto.getProductIds().split(",");
                    for (String productIdStr : productIds) {
                        Long productId = Long.parseLong(productIdStr.trim());
                        System.out.println("[Discount] Removing all discounts for PRODUCT id: " + productId);
                        List<DiscountRule> rules = discountRuleRepository.findByProductIdAndDiscountStatusTrue(productId);
                        for (DiscountRule rule : rules) {
                            System.out.println("[Discount] Deleting DiscountRule id: " + rule.getId() + ", type: " + rule.getTargetType());
                            discountRuleRepository.delete(rule);
                        }
                    }
                }
                break;
        }
    }

    private void removeConflictingCategoryDiscounts(Long categoryId) {
        List<DiscountRule> existingRules = discountRuleRepository.findByCategoryIdAndDiscountStatusTrue(categoryId);
        for (DiscountRule rule : existingRules) {
            if (rule.getTargetType() == DiscountEventEnum.CATEGORY) {
                System.out.println("[Discount] Deleting CATEGORY DiscountRule id: " + rule.getId() + " for categoryId: " + categoryId);
                discountRuleRepository.delete(rule);
            }
        }
        // Note: We don't remove brand-category discounts here anymore as they should be handled specifically
        // in the brand-category removal methods
    }

    private void removeConflictingBrandDiscounts(Long brandId) {
        List<DiscountRule> existingRules = discountRuleRepository.findByBrandIdAndDiscountStatusTrue(brandId);
        for (DiscountRule rule : existingRules) {
            if (rule.getTargetType() == DiscountEventEnum.BRAND) {
                System.out.println("[Discount] Deleting BRAND DiscountRule id: " + rule.getId() + " for brandId: " + brandId);
                discountRuleRepository.delete(rule);
            }
        }
        // Note: We don't remove brand-category discounts here anymore as they should be handled specifically
        // in the brand-category removal methods
    }

    private void removeConflictingBrandCategoryDiscounts(Long brandId, Long categoryId) {
        List<DiscountRule> existingRules = discountRuleRepository.findByBrandIdAndCategoryIdAndDiscountStatusTrue(brandId, categoryId);
        for (DiscountRule rule : existingRules) {
            System.out.println("[Discount] Deleting BRAND_CATEGORY DiscountRule id: " + rule.getId() + " for brandId: " + brandId + ", categoryId: " + categoryId);
            discountRuleRepository.delete(rule);
        }
    }

    // New method to remove only brand discounts that would conflict with a specific brand-category
    private void removeConflictingBrandDiscountsForBrandCategory(Long brandId, Long categoryId) {
        List<DiscountRule> existingRules = discountRuleRepository.findByBrandIdAndDiscountStatusTrue(brandId);
        for (DiscountRule rule : existingRules) {
            if (rule.getTargetType() == DiscountEventEnum.BRAND) {
                System.out.println("[Discount] Deleting BRAND DiscountRule id: " + rule.getId() + " for brandId: " + brandId + " (conflicts with brand-category)");
                discountRuleRepository.delete(rule);
            }
        }
    }

    // New method to remove only category discounts that would conflict with a specific brand-category
    private void removeConflictingCategoryDiscountsForBrandCategory(Long brandId, Long categoryId) {
        List<DiscountRule> existingRules = discountRuleRepository.findByCategoryIdAndDiscountStatusTrue(categoryId);
        for (DiscountRule rule : existingRules) {
            if (rule.getTargetType() == DiscountEventEnum.CATEGORY) {
                System.out.println("[Discount] Deleting CATEGORY DiscountRule id: " + rule.getId() + " for categoryId: " + categoryId + " (conflicts with brand-category)");
                discountRuleRepository.delete(rule);
            }
        }
    }

    // Remove brand discount only for products in the given brand and category
    private void removeBrandDiscountForBrandAndCategory(Long brandId, Long categoryId) {
        // Get all products for this brand and category
        List<Product> products = productRepository.findByBrandIdAndCategoryId(brandId, categoryId);
        for (Product product : products) {
            // Find all discount rules for this product
            List<DiscountRule> rules = discountRuleRepository.findByProductIdAndDiscountStatusTrue(product.getId());
            for (DiscountRule rule : rules) {
                if (rule.getTargetType() == DiscountEventEnum.BRAND) {
                    System.out.println("[Discount] Deleting BRAND DiscountRule id: " + rule.getId() + " for productId: " + product.getId());
                    discountRuleRepository.delete(rule);
                }
            }
        }
    }

    // Add the new helper method
    private void removeCategoryDiscountForBrandAndCategory(Long brandId, Long categoryId) {
        // Get all products for this brand and category
        List<Product> products = productRepository.findByBrandIdAndCategoryId(brandId, categoryId);
        for (Product product : products) {
            // Find all discount rules for this product
            List<DiscountRule> rules = discountRuleRepository.findByProductIdAndDiscountStatusTrue(product.getId());
            for (DiscountRule rule : rules) {
                if (rule.getTargetType() == DiscountEventEnum.CATEGORY) {
                    System.out.println("[Discount] Deleting CATEGORY DiscountRule id: " + rule.getId() + " for productId: " + product.getId());
                    discountRuleRepository.delete(rule);
                }
            }
        }
    }

    @Override
    public ResponseEntity<?> checkDuplicateDiscount(DiscountRequestDTO dto) {
        try {
            List<Map<String, Object>> conflicts = new ArrayList<>();
            String targetType = dto.getTargetType().toUpperCase();

            switch (targetType) {
                case "BRAND":
                    if (dto.getBrandIds() != null && !dto.getBrandIds().trim().isEmpty()) {
                        String[] brandIds = dto.getBrandIds().split(",");
                        for (String brandIdStr : brandIds) {
                            Long brandId = Long.parseLong(brandIdStr.trim());
                            checkBrandDuplicate(brandId, conflicts);
                        }
                    } else if (dto.getBrandId() != null) {
                        checkBrandDuplicate(dto.getBrandId(), conflicts);
                    }
                    break;
                case "CATEGORY":
                    if (dto.getCategoryIds() != null && !dto.getCategoryIds().trim().isEmpty()) {
                        String[] categoryIds = dto.getCategoryIds().split(",");
                        for (String categoryIdStr : categoryIds) {
                            Long categoryId = Long.parseLong(categoryIdStr.trim());
                            checkCategoryDuplicate(categoryId, conflicts);
                        }
                    } else if (dto.getCategoryId() != null) {
                        checkCategoryDuplicate(dto.getCategoryId(), conflicts);
                    }
                    break;
                case "PRODUCT":
                    if (dto.getProductIds() != null && !dto.getProductIds().trim().isEmpty()) {
                        checkProductDuplicates(dto.getProductIds(), conflicts);
                    }
                    break;
                case "BRAND_CATEGORY":
                    if (dto.getBrandCategoryIds() != null && !dto.getBrandCategoryIds().trim().isEmpty()) {
                        checkBrandCategoryDuplicates(dto.getBrandCategoryIds(), conflicts);
                    } else if (dto.getBrandId() != null && dto.getCategoryId() != null) {
                        checkBrandCategoryDuplicate(dto.getBrandId(), dto.getCategoryId(), conflicts);
                    }
                    break;
                case "USER_PRODUCT":
                    if (dto.getUserIds() != null && !dto.getUserIds().trim().isEmpty() &&
                        dto.getProductIds() != null && !dto.getProductIds().trim().isEmpty()) {
                        String[] userIds = dto.getUserIds().split(",");
                        String[] productIds = dto.getProductIds().split(",");
                        for (String userIdStr : userIds) {
                            for (String productIdStr : productIds) {
                                checkUserProductDuplicate(Long.parseLong(userIdStr.trim()), Long.parseLong(productIdStr.trim()), conflicts);
                            }
                        }
                    }
                    break;
                case "USER_BRAND":
                     if (dto.getUserIds() != null && !dto.getUserIds().trim().isEmpty() &&
                         dto.getBrandIds() != null && !dto.getBrandIds().trim().isEmpty()) {
                        String[] userIds = dto.getUserIds().split(",");
                        String[] brandIds = dto.getBrandIds().split(",");
                        for (String userIdStr : userIds) {
                            for (String brandIdStr : brandIds) {
                                checkUserBrandDuplicate(Long.parseLong(userIdStr.trim()), Long.parseLong(brandIdStr.trim()), conflicts);
                            }
                        }
                    }
                    break;
                case "USER_CATEGORY":
                    if (dto.getUserIds() != null && !dto.getUserIds().trim().isEmpty() &&
                        dto.getCategoryIds() != null && !dto.getCategoryIds().trim().isEmpty()) {
                        String[] userIds = dto.getUserIds().split(",");
                        String[] categoryIds = dto.getCategoryIds().split(",");
                        for (String userIdStr : userIds) {
                            for (String categoryIdStr : categoryIds) {
                                checkUserCategoryDuplicate(Long.parseLong(userIdStr.trim()), Long.parseLong(categoryIdStr.trim()), conflicts);
                            }
                        }
                    }
                    break;
                case "USER_BRAND_CATEGORY":
                    if (dto.getUserIds() != null && !dto.getUserIds().trim().isEmpty() &&
                        dto.getBrandCategoryIds() != null && !dto.getBrandCategoryIds().trim().isEmpty()) {
                        String[] userIds = dto.getUserIds().split(",");
                        String[] brandCategoryIds = dto.getBrandCategoryIds().split(",");
                        for (String userIdStr : userIds) {
                            for (String brandCategoryIdStr : brandCategoryIds) {
                                String[] parts = brandCategoryIdStr.trim().split("-");
                                if (parts.length == 2) {
                                    checkUserBrandCategoryDuplicate(Long.parseLong(userIdStr.trim()), Long.parseLong(parts[0]), Long.parseLong(parts[1]), conflicts);
                                }
                            }
                        }
                    }
                    break;
            }

            return ResponseEntity.ok(conflicts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private void checkBrandDuplicate(Long brandId, List<Map<String, Object>> conflicts) {
        Brand brand = brandRepository.findById(brandId).orElse(null);
        if (brand == null) return;

        // 1. Check for existing brand discounts
        List<DiscountRule> existingRules = discountRuleRepository.findByBrandIdAndDiscountStatusTrue(brandId);
        for (DiscountRule rule : existingRules) {
            if (rule.getTargetType() == DiscountEventEnum.BRAND) {
                Map<String, Object> conflict = new HashMap<>();
                conflict.put("targetType", "BRAND");
                conflict.put("targetId", brandId);
                conflict.put("targetName", brand.getName());
                conflict.put("existingDiscountName", rule.getDiscount().getName());
                conflict.put("existingDiscountId", rule.getDiscount().getId());
                conflict.put("conflictType", "BRAND_DISCOUNT");
                conflict.put("conflictDescription", "Brand already has a discount");
                conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                conflicts.add(conflict);
            }
        }

        // 2. Check for existing brand-category discounts that would be affected
        // Get all categories that this brand is joined with
        List<Category> categoriesJoinedWithBrand = categoryRepository.findAllCategoryByBrandId(brandId);
        for (Category category : categoriesJoinedWithBrand) {
            List<DiscountRule> brandCategoryRules = discountRuleRepository.findByBrandIdAndCategoryIdAndDiscountStatusTrue(brandId, category.getId());
            for (DiscountRule rule : brandCategoryRules) {
                if (rule.getTargetType() == DiscountEventEnum.BRAND_CATEGORY) {
                    Map<String, Object> conflict = new HashMap<>();
                    conflict.put("targetType", "BRAND");
                    conflict.put("targetId", brandId);
                    conflict.put("targetName", brand.getName());
                    conflict.put("existingDiscountName", rule.getDiscount().getName());
                    conflict.put("existingDiscountId", rule.getDiscount().getId());
                    conflict.put("conflictType", "BRAND_CATEGORY_DISCOUNT");
                    conflict.put("conflictDescription", "Brand has a specific discount for category '" + category.getName() + "' that would be overridden");
                    conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                    conflict.put("conflictingCategoryId", category.getId());
                    conflict.put("conflictingCategoryName", category.getName());
                    conflicts.add(conflict);
                }
            }
        }

        // 3. Check for existing category discounts that would affect this brand's products
        for (Category category : categoriesJoinedWithBrand) {
            List<DiscountRule> categoryRules = discountRuleRepository.findByCategoryIdAndDiscountStatusTrue(category.getId());
            for (DiscountRule rule : categoryRules) {
                if (rule.getTargetType() == DiscountEventEnum.CATEGORY) {
                    Map<String, Object> conflict = new HashMap<>();
                    conflict.put("targetType", "BRAND");
                    conflict.put("targetId", brandId);
                    conflict.put("targetName", brand.getName());
                    conflict.put("existingDiscountName", rule.getDiscount().getName());
                    conflict.put("existingDiscountId", rule.getDiscount().getId());
                    conflict.put("conflictType", "CATEGORY_DISCOUNT");
                    conflict.put("conflictDescription", "Category '" + category.getName() + "' already has a discount that affects products of this brand.");
                    conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                    conflict.put("conflictingCategoryId", category.getId());
                    conflict.put("conflictingCategoryName", category.getName());
                    conflicts.add(conflict);
                }
            }
        }
    }

    private void checkUserBrandDuplicate(Long userId, Long brandId, List<Map<String, Object>> conflicts) {
        User user = userRepository.findById(userId).orElse(null);
        Brand brand = brandRepository.findById(brandId).orElse(null);
        if (user == null || brand == null) return;

        // 1. Check for existing user-brand discounts
        List<DiscountRule> existingRules = discountRuleRepository.findByUserIdAndBrandIdAndDiscountStatusTrue(userId, brandId);
        for (DiscountRule rule : existingRules) {
            if (rule.getTargetType() == DiscountEventEnum.USER_BRAND) {
                Map<String, Object> conflict = new HashMap<>();
                conflict.put("targetType", "USER_BRAND");
                conflict.put("targetId", "user-" + userId + "-brand-" + brandId); // Unique conflict ID
                conflict.put("userId", userId);
                conflict.put("userName", user.getName());
                conflict.put("brandId", brandId);
                conflict.put("brandName", brand.getName());
                conflict.put("existingDiscountName", rule.getDiscount().getName());
                conflict.put("existingDiscountId", rule.getDiscount().getId());
                conflict.put("conflictType", "USER_BRAND_DISCOUNT");
                conflict.put("conflictDescription", "This user already has a discount for this brand.");
                conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                conflicts.add(conflict);
            }
        }

        // 2. Check for existing user-brand-category discounts that would be affected
        List<Category> categoriesJoinedWithBrand = categoryRepository.findAllCategoryByBrandId(brandId);
        for (Category category : categoriesJoinedWithBrand) {
            List<DiscountRule> userBrandCategoryRules = discountRuleRepository.findByUserIdAndBrandIdAndCategoryIdAndDiscountStatusTrue(userId, brandId, category.getId());
            for (DiscountRule rule : userBrandCategoryRules) {
                if (rule.getTargetType() == DiscountEventEnum.USER_BRAND_CATEGORY) {
                    Map<String, Object> conflict = new HashMap<>();
                    conflict.put("targetType", "USER_BRAND");
                    conflict.put("targetId", "user-" + userId + "-brand-" + brandId + "-category-" + category.getId()); // Unique conflict ID
                    conflict.put("userId", userId);
                    conflict.put("userName", user.getName());
                    conflict.put("brandId", brandId);
                    conflict.put("brandName", brand.getName());
                    conflict.put("existingDiscountName", rule.getDiscount().getName());
                    conflict.put("existingDiscountId", rule.getDiscount().getId());
                    conflict.put("conflictType", "USER_BRAND_CATEGORY_DISCOUNT");
                    conflict.put("conflictDescription", "User has a specific discount for brand '" + brand.getName() + "' and category '" + category.getName() + "' that would be overridden");
                    conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                    conflict.put("conflictingCategoryId", category.getId());
                    conflict.put("conflictingCategoryName", category.getName());
                    conflicts.add(conflict);
                }
            }
        }

        // 3. Check for existing user-category discounts that would affect this brand's products for this user
        for (Category category : categoriesJoinedWithBrand) {
            List<DiscountRule> userCategoryRules = discountRuleRepository.findByUserIdAndCategoryIdAndDiscountStatusTrue(userId, category.getId());
            for (DiscountRule rule : userCategoryRules) {
                if (rule.getTargetType() == DiscountEventEnum.USER_CATEGORY) {
                    Map<String, Object> conflict = new HashMap<>();
                    conflict.put("targetType", "USER_BRAND");
                    conflict.put("targetId", "user-" + userId + "-category-" + category.getId()); // Unique conflict ID
                    conflict.put("userId", userId);
                    conflict.put("userName", user.getName());
                    conflict.put("brandId", brandId);
                    conflict.put("brandName", brand.getName());
                    conflict.put("existingDiscountName", rule.getDiscount().getName());
                    conflict.put("existingDiscountId", rule.getDiscount().getId());
                    conflict.put("conflictType", "USER_CATEGORY_DISCOUNT");
                    conflict.put("conflictDescription", "User already has a category discount for category '" + category.getName() + "' that affects products of this brand.");
                    conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                    conflict.put("conflictingCategoryId", category.getId());
                    conflict.put("conflictingCategoryName", category.getName());
                    conflicts.add(conflict);
                }
            }
        }
        
        // 4. Check for GENERAL brand discount (NON-RECURSIVE)
        List<DiscountRule> generalBrandRules = discountRuleRepository.findByBrandIdAndDiscountStatusTrue(brandId);
        for (DiscountRule rule : generalBrandRules) {
            if (rule.getTargetType() == DiscountEventEnum.BRAND) {
                 Map<String, Object> conflict = new HashMap<>();
                conflict.put("targetType", "BRAND");
                conflict.put("targetId", brandId);
                conflict.put("targetName", brand.getName());
                conflict.put("existingDiscountName", rule.getDiscount().getName());
                conflict.put("existingDiscountId", rule.getDiscount().getId());
                conflict.put("conflictType", "GENERAL_BRAND_DISCOUNT");
                conflict.put("conflictDescription", "A general discount for this brand already exists.");
                conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                conflicts.add(conflict);
            }
        }
    }

    private void checkUserCategoryDuplicate(Long userId, Long categoryId, List<Map<String, Object>> conflicts) {
        User user = userRepository.findById(userId).orElse(null);
        Category category = categoryRepository.findById(categoryId).orElse(null);
        if (user == null || category == null) return;

        // 1. Check for existing user-category discounts
        List<DiscountRule> existingRules = discountRuleRepository.findByUserIdAndCategoryIdAndDiscountStatusTrue(userId, categoryId);
        for (DiscountRule rule : existingRules) {
            if (rule.getTargetType() == DiscountEventEnum.USER_CATEGORY) {
                Map<String, Object> conflict = new HashMap<>();
                conflict.put("targetType", "USER_CATEGORY");
                conflict.put("targetId", "user-" + userId + "-category-" + categoryId); // Unique conflict ID
                conflict.put("userId", userId);
                conflict.put("userName", user.getName());
                conflict.put("categoryId", categoryId);
                conflict.put("categoryName", category.getName());
                conflict.put("existingDiscountName", rule.getDiscount().getName());
                conflict.put("existingDiscountId", rule.getDiscount().getId());
                conflict.put("conflictType", "USER_CATEGORY_DISCOUNT");
                conflict.put("conflictDescription", "This user already has a discount for this category.");
                conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                conflicts.add(conflict);
            }
        }
        
        // 2. Check for GENERAL category discount (NON-RECURSIVE)
        List<DiscountRule> generalCategoryRules = discountRuleRepository.findByCategoryIdAndDiscountStatusTrue(categoryId);
        for (DiscountRule rule : generalCategoryRules) {
            if (rule.getTargetType() == DiscountEventEnum.CATEGORY) {
                Map<String, Object> conflict = new HashMap<>();

                if(category == null) continue;
                conflict.put("targetType", "CATEGORY");
                conflict.put("targetId", categoryId);
                conflict.put("targetName", category.getName());
                conflict.put("existingDiscountName", rule.getDiscount().getName());
                conflict.put("existingDiscountId", rule.getDiscount().getId());
                conflict.put("conflictType", "GENERAL_CATEGORY_DISCOUNT");
                conflict.put("conflictDescription", "A general discount for this category already exists.");
                conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                conflicts.add(conflict);
            }
        }
    }

    private void checkUserBrandCategoryDuplicate(Long userId, Long brandId, Long categoryId, List<Map<String, Object>> conflicts) {
        User user = userRepository.findById(userId).orElse(null);
        Brand brand = brandRepository.findById(brandId).orElse(null);
        Category category = categoryRepository.findById(categoryId).orElse(null);
        if (user == null || brand == null || category == null) return;

        // 1. Check for existing user-brand-category discounts
        List<DiscountRule> existingRules = discountRuleRepository.findByUserIdAndBrandIdAndCategoryIdAndDiscountStatusTrue(userId, brandId, categoryId);
        for (DiscountRule rule : existingRules) {
            if (rule.getTargetType() == DiscountEventEnum.USER_BRAND_CATEGORY) {
                Map<String, Object> conflict = new HashMap<>();
                conflict.put("targetType", "USER_BRAND_CATEGORY");
                conflict.put("targetId", "user-" + userId + "-brand-" + brandId + "-category-" + categoryId); // Unique conflict ID
                conflict.put("userId", userId);
                conflict.put("userName", user.getName());
                conflict.put("brandId", brandId);
                conflict.put("brandName", brand.getName());
                conflict.put("categoryId", categoryId);
                conflict.put("categoryName", category.getName());
                conflict.put("existingDiscountName", rule.getDiscount().getName());
                conflict.put("existingDiscountId", rule.getDiscount().getId());
                conflict.put("conflictType", "USER_BRAND_CATEGORY_DISCOUNT");
                conflict.put("conflictDescription", "This user already has a discount for this brand-category combination.");
                conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                conflicts.add(conflict);
            }
        }
        
        // 2. Check for GENERAL brand-category discount (NON-RECURSIVE)
        List<DiscountRule> generalBrandCategoryRules = discountRuleRepository.findByBrandIdAndCategoryIdAndDiscountStatusTrue(brandId, categoryId);
        for (DiscountRule rule : generalBrandCategoryRules) {
             if (rule.getTargetType() == DiscountEventEnum.BRAND_CATEGORY) {
                Map<String, Object> conflict = new HashMap<>();
                if (brand == null || category == null) continue;
                conflict.put("targetType", "BRAND_CATEGORY");
                conflict.put("targetId", brandId + "-" + categoryId);
                conflict.put("targetName", brand.getName() + " - " + category.getName());
                conflict.put("existingDiscountName", rule.getDiscount().getName());
                conflict.put("existingDiscountId", rule.getDiscount().getId());
                conflict.put("conflictType", "GENERAL_BRAND_CATEGORY_DISCOUNT");
                conflict.put("conflictDescription", "A general discount for this brand-category combination already exists.");
                conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                conflicts.add(conflict);
            }
        }
    }

    private void checkUserProductDuplicate(Long userId, Long productId, List<Map<String, Object>> conflicts) {
        User user = userRepository.findById(userId).orElse(null);
        Product product = productRepository.findById(productId).orElse(null);
        if (user == null || product == null) return;

        // 1. Check for existing user-product discounts
        List<DiscountRule> existingRules = discountRuleRepository.findByUserIdAndProductIdAndDiscountStatusTrue(userId, productId);
        for (DiscountRule rule : existingRules) {
            if (rule.getTargetType() == DiscountEventEnum.USER_PRODUCT) {
                Map<String, Object> conflict = new HashMap<>();
                conflict.put("targetType", "USER_PRODUCT");
                conflict.put("targetId", "user-" + userId + "-product-" + productId); // Unique conflict ID
                conflict.put("userId", userId);
                conflict.put("userName", user.getName());
                conflict.put("productId", productId);
                conflict.put("productName", product.getProductName());
                conflict.put("existingDiscountName", rule.getDiscount().getName());
                conflict.put("existingDiscountId", rule.getDiscount().getId());
                conflict.put("conflictType", "USER_PRODUCT_DISCOUNT");
                conflict.put("conflictDescription", "This user already has a discount for this product.");
                conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                conflicts.add(conflict);
            }
        }
        
        // 2. Check for GENERAL product discount (NON-RECURSIVE)
        List<DiscountRule> generalProductRules = discountRuleRepository.findByProductIdAndDiscountStatusTrue(productId);
        for (DiscountRule rule : generalProductRules) {
            if (rule.getTargetType() == DiscountEventEnum.PRODUCT) {
                Map<String, Object> conflict = new HashMap<>();
                if(product == null) continue;
                conflict.put("targetType", "PRODUCT");
                conflict.put("targetId", productId);
                conflict.put("targetName", product.getProductName());
                conflict.put("existingDiscountName", rule.getDiscount().getName());
                conflict.put("existingDiscountId", rule.getDiscount().getId());
                conflict.put("conflictType", "GENERAL_PRODUCT_DISCOUNT");
                conflict.put("conflictDescription", "A general discount for this product already exists.");
                conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                conflicts.add(conflict);
            }
        }
    }

    private void checkCategoryDuplicate(Long categoryId, List<Map<String, Object>> conflicts) {
        Category category = categoryRepository.findById(categoryId).orElse(null);
        if (category == null) return;

        // 1. Check for direct category discounts
        List<DiscountRule> existingCategoryRules = discountRuleRepository.findByCategoryIdAndDiscountStatusTrue(categoryId);
        for (DiscountRule rule : existingCategoryRules) {
            if (rule.getTargetType() == DiscountEventEnum.CATEGORY) {
                Map<String, Object> conflict = new HashMap<>();
                conflict.put("targetType", "CATEGORY");
                conflict.put("targetId", categoryId);
                conflict.put("targetName", category.getName());
                conflict.put("existingDiscountName", rule.getDiscount().getName());
                conflict.put("existingDiscountId", rule.getDiscount().getId());
                conflict.put("conflictType", "CATEGORY_DISCOUNT");
                conflict.put("conflictDescription", "Category already has a direct discount");
                conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                conflicts.add(conflict);
            }
        }

        // 2. Check for brand-category discounts that include this category
        for (DiscountRule rule : existingCategoryRules) {
            if (rule.getTargetType() == DiscountEventEnum.BRAND_CATEGORY && rule.getBrand() != null) {
                Map<String, Object> conflict = new HashMap<>();
                conflict.put("targetType", "CATEGORY");
                conflict.put("targetId", categoryId);
                conflict.put("targetName", category.getName());
                conflict.put("existingDiscountName", rule.getDiscount().getName());
                conflict.put("existingDiscountId", rule.getDiscount().getId());
                conflict.put("conflictType", "BRAND_CATEGORY_DISCOUNT");
                conflict.put("conflictDescription", "Category is already discounted in brand: " + rule.getBrand().getName());
                conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                conflicts.add(conflict);
            }
        }

        // 3. Check for brand discounts ONLY if the category is actually joined with those brands
        // Get all brands that are joined with this category
        List<Brand> brandsJoinedWithCategory = brandRepository.findAllBrandByCateId(categoryId);

        for (Brand brand : brandsJoinedWithCategory) {
            List<DiscountRule> brandRules = discountRuleRepository.findByBrandIdAndDiscountStatusTrue(brand.getId());
            for (DiscountRule rule : brandRules) {
                if (rule.getTargetType() == DiscountEventEnum.BRAND) {
                    Map<String, Object> conflict = new HashMap<>();
                    conflict.put("targetType", "CATEGORY");
                    conflict.put("targetId", categoryId);
                    conflict.put("targetName", category.getName());
                    conflict.put("existingDiscountName", rule.getDiscount().getName());
                    conflict.put("existingDiscountId", rule.getDiscount().getId());
                    conflict.put("conflictType", "BRAND_DISCOUNT");
                    conflict.put("conflictDescription", "Category is joined with brand '" + brand.getName() + "' which already has a discount");
                    conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                    conflict.put("conflictingBrandId", brand.getId());
                    conflict.put("conflictingBrandName", brand.getName());
                    conflicts.add(conflict);
                }
            }
        }
    }

    private void checkProductDuplicates(String productIds, List<Map<String, Object>> conflicts) {
        String[] ids = productIds.split(",");
        for (String idStr : ids) {
            Long productId = Long.parseLong(idStr.trim());
            Product product = productRepository.findById(productId).orElse(null);
            if (product == null) continue;

            List<DiscountRule> existingRules = discountRuleRepository.findByProductIdAndDiscountStatusTrue(productId);
            for (DiscountRule rule : existingRules) {
                Map<String, Object> conflict = new HashMap<>();
                conflict.put("targetType", "PRODUCT");
                conflict.put("targetId", productId);
                conflict.put("targetName", product.getProductName());
                conflict.put("existingDiscountName", rule.getDiscount().getName());
                conflict.put("existingDiscountId", rule.getDiscount().getId());
                conflicts.add(conflict);
            }
        }
    }

    private void checkBrandCategoryDuplicates(String brandCategoryIds, List<Map<String, Object>> conflicts) {
        String[] ids = brandCategoryIds.split(",");
        for (String idStr : ids) {
            String[] parts = idStr.trim().split("-");
            if (parts.length == 2) {
                Long brandId = Long.parseLong(parts[0]);
                Long categoryId = Long.parseLong(parts[1]);
                checkBrandCategoryDuplicate(brandId, categoryId, conflicts);
            }
        }
    }

    private void checkBrandCategoryDuplicate(Long brandId, Long categoryId, List<Map<String, Object>> conflicts) {
        Brand brand = brandRepository.findById(brandId).orElse(null);
        Category category = categoryRepository.findById(categoryId).orElse(null);
        if (brand == null || category == null) return;

        // 1. Check for existing brand-category discounts
        List<DiscountRule> existingRules = discountRuleRepository.findByBrandIdAndCategoryIdAndDiscountStatusTrue(brandId, categoryId);
        for (DiscountRule rule : existingRules) {
            Map<String, Object> conflict = new HashMap<>();
            conflict.put("targetType", "BRAND_CATEGORY");
            conflict.put("targetId", brandId + "-" + categoryId);
            conflict.put("targetName", brand.getName() + " - " + category.getName());
            conflict.put("existingDiscountName", rule.getDiscount().getName());
            conflict.put("existingDiscountId", rule.getDiscount().getId());
            conflict.put("conflictType", "BRAND_CATEGORY_DISCOUNT");
            conflict.put("conflictDescription", "Brand-Category combination already has a discount");
            conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
            conflicts.add(conflict);
        }

        // 2. Check for existing brand discounts that would affect the same products
        List<DiscountRule> existingBrandRules = discountRuleRepository.findByBrandIdAndDiscountStatusTrue(brandId);
        for (DiscountRule rule : existingBrandRules) {
            if (rule.getTargetType() == DiscountEventEnum.BRAND) {
                Map<String, Object> conflict = new HashMap<>();
                conflict.put("targetType", "BRAND_CATEGORY");
                conflict.put("targetId", brandId + "-" + categoryId);
                conflict.put("targetName", brand.getName() + " - " + category.getName());
                conflict.put("existingDiscountName", rule.getDiscount().getName());
                conflict.put("existingDiscountId", rule.getDiscount().getId());
                conflict.put("conflictType", "BRAND_DISCOUNT");
                conflict.put("conflictDescription", "Brand '" + brand.getName() + "' already has a discount that affects all its products including those in category '" + category.getName() + "'");
                conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                conflicts.add(conflict);
            }
        }

        // 3. Check for existing category discounts that would affect the same products
        List<DiscountRule> existingCategoryRules = discountRuleRepository.findByCategoryIdAndDiscountStatusTrue(categoryId);
        for (DiscountRule rule : existingCategoryRules) {
            if (rule.getTargetType() == DiscountEventEnum.CATEGORY) {
                Map<String, Object> conflict = new HashMap<>();
                conflict.put("targetType", "BRAND_CATEGORY");
                conflict.put("targetId", brandId + "-" + categoryId);
                conflict.put("targetName", brand.getName() + " - " + category.getName());
                conflict.put("existingDiscountName", rule.getDiscount().getName());
                conflict.put("existingDiscountId", rule.getDiscount().getId());
                conflict.put("conflictType", "CATEGORY_DISCOUNT");
                conflict.put("conflictDescription", "Category '" + category.getName() + "' already has a discount that affects all its products including those from brand '" + brand.getName() + "'");
                conflict.put("resolutionOptions", Arrays.asList("SKIP", "OVERWRITE"));
                conflicts.add(conflict);
            }
        }
    }

    private Discount createDiscounts(DiscountRequestDTO dto) {
        Discount discount = new Discount();
        discount.setName(dto.getName());
        discount.setDescription(dto.getDescription());
        discount.setDiscountType(DiscountType.valueOf(dto.getDiscountType()));
        
        // Convert percentage to decimal format for storage
        if (dto.getDiscountType().equals("PERCENTAGE")) {
            // Convert percentage to decimal (e.g., 1% -> 0.01, 10% -> 0.10)
            double percentageValue = dto.getDiscount_percent();
            double decimalValue = percentageValue / 100.0;
            discount.setDiscountValue(decimalValue);
        } else {
            // Fixed amount remains unchanged
            discount.setDiscountValue(dto.getDiscount_amount());
        }
        
        discount.setDescription(dto.getDescription());
        discount.setStartDate(dto.getStartDate().toLocalDate());
        discount.setEndDate(dto.getEndDate().toLocalDate());
        // Set status based on current date
        LocalDate today = LocalDate.now();
        if ((today.isAfter(discount.getStartDate().minusDays(1))) && (today.isBefore(discount.getEndDate().plusDays(1)))) {
            discount.setStatus(true); // Active
        } else {
            discount.setStatus(false); // Inactive
        }
        discount.setAutoApply(true);
        return discountRepository.save(discount);
    }

    public List<DiscountDTO> getAllDiscounts() {
        List<Discount> Discounts = discountRepository.findAll();
        List<DiscountDTO> dtos = new ArrayList<>();
        for(Discount d : Discounts){
            // Update autoApply field if it's null
            if (d.getAutoApply() == null) {
                // If discount has a code, it's a coupon (autoApply = false)
                // If discount has no code, it's a discount event (autoApply = true)
                d.setAutoApply(d.getCode() == null || d.getCode().trim().isEmpty());
                discountRepository.save(d);
            }

            DiscountDTO dto = new DiscountDTO();
            dto.setId(d.getId());
            dto.setName(d.getName());
            dto.setDescription(d.getDescription());
            dto.setDiscountType(d.getDiscountType());
            dto.setDiscountValue(d.getDiscountValue());
            dto.setStartDate(d.getStartDate());
            dto.setEndDate(d.getEndDate());
            LocalDate today = LocalDate.now();
            boolean isActive = d.isStatus() && today.isAfter(d.getStartDate().minusDays(1))
                    && today.isBefore(d.getEndDate().plusDays(1));
            dto.setStatus(isActive);
            dto.setAutoApply(d.getAutoApply()); // Add autoApply field
            // --- Aggregate from DiscountRule ---
            List<DiscountRule> rules = discountRuleRepository.findByDiscount_Id(d.getId());
            Set<Long> productIds = new HashSet<>();
            Set<Long> brandIds = new HashSet<>();
            Set<Long> categoryIds = new HashSet<>();
            Set<String> brandCategoryIds = new HashSet<>();

            for (DiscountRule rule : rules) {
                if (rule.getProduct() != null) productIds.add(rule.getProduct().getId());
                if (rule.getBrand() != null) brandIds.add(rule.getBrand().getId());
                if (rule.getCategory() != null) categoryIds.add(rule.getCategory().getId());
                if (rule.getBrand() != null && rule.getCategory() != null) {
                    brandCategoryIds.add(rule.getBrand().getId() + "-" + rule.getCategory().getId());
                }
            }

            // Set as comma-separated strings (or as List<Long> if your DTO supports it)
            dto.setProductIds(productIds.isEmpty() ? null : productIds.stream().map(String::valueOf).collect(Collectors.joining(",")));
            dto.setBrandIds(brandIds.isEmpty() ? null : brandIds.stream().map(String::valueOf).collect(Collectors.joining(",")));
            dto.setCategoryIds(categoryIds.isEmpty() ? null : categoryIds.stream().map(String::valueOf).collect(Collectors.joining(",")));
            dto.setBrandCategoryIds(brandCategoryIds.isEmpty() ? null : String.join(",", brandCategoryIds));
            dtos.add(dto);
        }
        return dtos;
    }

    @Override
    public ResponseEntity<?> getActiveDiscounts() {
        try {
            List<Map<String, Object>> activeDiscounts = new ArrayList<>();

            // Get all active discounts
            List<Discount> discounts = discountRepository.findByStatusTrue();

            for (Discount discount : discounts) {
                LocalDate today = LocalDate.now();
                boolean isActive =discount.isStatus() && today.isAfter(discount.getStartDate().minusDays(1))
                        && today.isBefore(discount.getEndDate().plusDays(1));
                if (!isActive) continue;
                Map<String, Object> discountInfo = new HashMap<>();
                discountInfo.put("id", discount.getId());
                discountInfo.put("name", discount.getName());
                discountInfo.put("description", discount.getDescription());
                // Convert stored decimal percentage back to percentage format for display
                if (discount.getDiscountType() == DiscountType.PERCENTAGE) {
                    double percentageValue = discount.getDiscountValue() * 100.0;
                    discountInfo.put("discount_percent", percentageValue);
                    discountInfo.put("discount_amount", 0);
                } else {
                    discountInfo.put("discount_percent", 0);
                    discountInfo.put("discount_amount", discount.getDiscountValue());
                }
                discountInfo.put("discountType", discount.getDiscountType().toString());
                discountInfo.put("startDate", discount.getStartDate());
                discountInfo.put("endDate", discount.getEndDate());
                discountInfo.put("status", isActive);

                // Get discount rules
                List<Map<String, Object>> rules = new ArrayList<>();
                List<DiscountRule> discountRules = discountRuleRepository.findByDiscount_Id(discount.getId());

                for (DiscountRule rule : discountRules) {
                    Map<String, Object> ruleInfo = new HashMap<>();
                    ruleInfo.put("targetType", rule.getTargetType().toString());

                    switch (rule.getTargetType()) {
                        case PRODUCT:
                            if (rule.getProduct() != null) {
                                ruleInfo.put("productId", rule.getProduct().getId());
                            }
                            break;
                        case BRAND:
                            if (rule.getBrand() != null) {
                                ruleInfo.put("brandId", rule.getBrand().getId());
                                ruleInfo.put("brandName", rule.getBrand().getName());
                            }
                            break;
                        case CATEGORY:
                            if (rule.getCategory() != null) {
                                ruleInfo.put("categoryId", rule.getCategory().getId());
                                ruleInfo.put("categoryName", rule.getCategory().getName());
                            }
                            break;
                        case BRAND_CATEGORY:
                            if (rule.getBrand() != null && rule.getCategory() != null) {
                                ruleInfo.put("brandId", rule.getBrand().getId());
                                ruleInfo.put("brandName", rule.getBrand().getName());
                                ruleInfo.put("categoryId", rule.getCategory().getId());
                                ruleInfo.put("categoryName", rule.getCategory().getName());
                            }
                            break;
                        case USER_PRODUCT:
                            if (rule.getUser() != null) ruleInfo.put("userId", rule.getUser().getId());
                            if (rule.getProduct() != null) ruleInfo.put("productId", rule.getProduct().getId());
                            break;
                        case USER_BRAND:
                            if (rule.getUser() != null) ruleInfo.put("userId", rule.getUser().getId());
                            if (rule.getBrand() != null) {
                                ruleInfo.put("brandId", rule.getBrand().getId());
                                ruleInfo.put("brandName", rule.getBrand().getName());
                            }
                            break;
                        case USER_CATEGORY:
                            if (rule.getUser() != null) ruleInfo.put("userId", rule.getUser().getId());
                            if (rule.getCategory() != null) {
                                ruleInfo.put("categoryId", rule.getCategory().getId());
                                ruleInfo.put("categoryName", rule.getCategory().getName());
                            }
                            break;
                        case USER_BRAND_CATEGORY:
                            if (rule.getUser() != null) ruleInfo.put("userId", rule.getUser().getId());
                            if (rule.getBrand() != null) {
                                ruleInfo.put("brandId", rule.getBrand().getId());
                                ruleInfo.put("brandName", rule.getBrand().getName());
                            }
                            if (rule.getCategory() != null) {
                                ruleInfo.put("categoryId", rule.getCategory().getId());
                                ruleInfo.put("categoryName", rule.getCategory().getName());
                            }
                            break;
                        case VIP_TIER:
                            if (rule.getVipTier() != null) {
                                ruleInfo.put("vipTierId", rule.getVipTier().getId());
                                ruleInfo.put("vipTierName", rule.getVipTier().getName());
                            }
                            break;
                    }
                    rules.add(ruleInfo);
                }

                discountInfo.put("rules", rules);

                // Get affected product IDs based on discount rules
                List<Long> affectedProductIds = new ArrayList<>();

                for (DiscountRule rule : discountRules) {
                    switch (rule.getTargetType()) {
                        case PRODUCT:
                            if (rule.getProduct() != null) {
                                affectedProductIds.add(rule.getProduct().getId());
                            }
                            break;
                        case BRAND:
                            if (rule.getBrand() != null) {
                                // Get all products for this brand
                                List<Product> brandProducts = productRepository.findByBrandId(rule.getBrand().getId());
                                brandProducts.forEach(product -> affectedProductIds.add(product.getId()));
                            }
                            break;
                        case CATEGORY:
                            if (rule.getCategory() != null) {
                                // Get all products for this category
                                List<Product> categoryProducts = productRepository.findByCategoryId(rule.getCategory().getId());
                                categoryProducts.forEach(product -> affectedProductIds.add(product.getId()));
                            }
                            break;
                        case BRAND_CATEGORY:
                            if (rule.getBrand() != null && rule.getCategory() != null) {
                                // Get all products for this brand-category combination
                                List<Product> brandCategoryProducts = productRepository.findByBrandIdAndCategoryId(
                                        rule.getBrand().getId(), rule.getCategory().getId());
                                brandCategoryProducts.forEach(product -> affectedProductIds.add(product.getId()));
                            }
                            break;
                        case USER_PRODUCT:
                            if (rule.getUser() != null && rule.getProduct() != null) {
                                affectedProductIds.add(rule.getProduct().getId());
                            }
                            break;
                        case USER_BRAND:
                            if (rule.getUser() != null && rule.getBrand() != null) {
                                List<Product> userBrandProducts = productRepository.findByBrandId(rule.getBrand().getId());
                                userBrandProducts.forEach(product -> affectedProductIds.add(product.getId()));
                            }
                            break;
                        case USER_CATEGORY:
                            if (rule.getUser() != null && rule.getCategory() != null) {
                                List<Product> userCategoryProducts = productRepository.findByCategoryId(rule.getCategory().getId());
                                userCategoryProducts.forEach(product -> affectedProductIds.add(product.getId()));
                            }
                            break;
                        case USER_BRAND_CATEGORY:
                            if (rule.getUser() != null && rule.getBrand() != null && rule.getCategory() != null) {
                                List<Product> userBrandCategoryProducts = productRepository.findByBrandIdAndCategoryId(
                                        rule.getBrand().getId(), rule.getCategory().getId());
                                userBrandCategoryProducts.forEach(product -> affectedProductIds.add(product.getId()));
                            }
                            break;
                    }
                }

                discountInfo.put("affectedProductIds", affectedProductIds);
                activeDiscounts.add(discountInfo);
            }

            return ResponseEntity.ok(activeDiscounts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @Override
    public ResponseEntity<?> updateDiscount(Long id, DiscountRequestDTO dto) {
        try {
            // Find the existing discount
            Discount existingDiscount = discountRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Discount not found with id: " + id));

            // Update discount properties
            existingDiscount.setName(dto.getName());
            existingDiscount.setDescription(dto.getDescription());
            existingDiscount.setDiscountType(DiscountType.valueOf(dto.getDiscountType()));
            
            // Convert percentage to decimal format for storage
            if (dto.getDiscountType().equals("PERCENTAGE")) {
                // Convert percentage to decimal (e.g., 1% -> 0.01, 10% -> 0.10)
                double percentageValue = dto.getDiscount_percent();
                double decimalValue = percentageValue / 100.0;
                existingDiscount.setDiscountValue(decimalValue);
            } else {
                // Fixed amount remains unchanged
                existingDiscount.setDiscountValue(dto.getDiscount_amount());
            }
            
            existingDiscount.setDescription(dto.getDescription());
            existingDiscount.setStartDate(dto.getStartDate().toLocalDate());
            existingDiscount.setEndDate(dto.getEndDate().toLocalDate());
            existingDiscount.setStatus(dto.isStatus());

            // Save the updated discount
            discountRepository.save(existingDiscount);
            System.out.println("description :"+ dto.getDescription());
            return ResponseEntity.ok(Map.of("message", "Discount updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }

    }

    @Override
    public ResponseEntity<?> getDiscountsByProduct(Long productId) {
        try {
            List<Map<String, Object>> productDiscounts = new ArrayList<>();
            LocalDate currentDate = LocalDate.now();

            // Get all active discounts
            List<Discount> allDiscounts = discountRepository.findAll();

            for (Discount discount : allDiscounts) {
                // Dynamically calculate if discount should be active
                boolean isActive = currentDate.isAfter(discount.getStartDate().minusDays(1))
                        && currentDate.isBefore(discount.getEndDate().plusDays(1));

                // Only include discounts that are currently active
                if (!isActive) {
                    continue; // Skip inactive discounts
                }

                // Get discount rules for this discount
                List<DiscountRule> discountRules = discountRuleRepository.findByDiscount_Id(discount.getId());

                // Check if this product is affected by any rule of this discount
                boolean isProductAffected = false;
                for (DiscountRule rule : discountRules) {
                    if (isProductAffectedByRule(productId, rule)) {
                        isProductAffected = true;
                        break;
                    }
                }

                if (isProductAffected) {
                    Map<String, Object> discountInfo = new HashMap<>();
                    discountInfo.put("id", discount.getId());
                    discountInfo.put("name", discount.getName());
                    discountInfo.put("description", discount.getDescription());
                    // Convert stored decimal percentage back to percentage format for display
                    if (discount.getDiscountType() == DiscountType.PERCENTAGE) {
                        double percentageValue = discount.getDiscountValue() * 100.0;
                        discountInfo.put("discount_percent", percentageValue);
                        discountInfo.put("discount_amount", 0);
                    } else {
                        discountInfo.put("discount_percent", 0);
                        discountInfo.put("discount_amount", discount.getDiscountValue());
                    }
                    discountInfo.put("discountType", discount.getDiscountType().toString());
                    discountInfo.put("startDate", discount.getStartDate());
                    discountInfo.put("endDate", discount.getEndDate());
                    discountInfo.put("status", isActive);
                    discountInfo.put("autoApply", discount.getAutoApply());
                    discountInfo.put("code", discount.getCode());

                    productDiscounts.add(discountInfo);
                }
            }

            return ResponseEntity.ok(productDiscounts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private boolean isProductAffectedByRule(Long productId, DiscountRule rule) {
        switch (rule.getTargetType()) {
            case PRODUCT:
                return rule.getProduct() != null && rule.getProduct().getId().equals(productId);
            case BRAND:
                if (rule.getBrand() != null) {
                    // Check if the product belongs to this brand
                    Product product = productRepository.findById(productId).orElse(null);
                    return product != null && product.getBrand() != null &&
                            product.getBrand().getId().equals(rule.getBrand().getId());
                }
                break;
            case CATEGORY:
                if (rule.getCategory() != null) {
                    // Check if the product belongs to this category
                    Product product = productRepository.findById(productId).orElse(null);
                    if (product != null) {
                        return product.getProductCategories().stream()
                                .anyMatch(pc -> pc.getCategory().getId().equals(rule.getCategory().getId()));
                    }
                }
                break;
            case BRAND_CATEGORY:
                if (rule.getBrand() != null && rule.getCategory() != null) {
                    // Check if the product belongs to this brand-category combination
                    Product product = productRepository.findById(productId).orElse(null);
                    if (product != null && product.getBrand() != null) {
                        return product.getBrand().getId().equals(rule.getBrand().getId()) &&
                                product.getProductCategories().stream()
                                        .anyMatch(pc -> pc.getCategory().getId().equals(rule.getCategory().getId()));
                    }
                }
                break;
        }
        return false;
    }

    public ResponseEntity<?> getDiscountById(Long id) {
        Optional<Discount> discountOpt = discountRepository.findById(id);
        if (discountOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Discount d = discountOpt.get();
        DiscountDTO dto = new DiscountDTO();
        dto.setId(d.getId());
        dto.setName(d.getName());
        dto.setDescription(d.getDescription());
        dto.setCode(d.getCode());
        dto.setDiscountType(d.getDiscountType());
        dto.setDiscountValue(d.getDiscountValue());
        dto.setStartDate(d.getStartDate());
        dto.setEndDate(d.getEndDate());
        dto.setStatus(d.isStatus());
        dto.setAutoApply(d.getAutoApply());
        return ResponseEntity.ok(dto);
    }

    // Helper method to send notification to all users
    private void sendDiscountNotificationToAllUsers(DiscountRequestDTO dto,Long discountId) {
        String discountValueText;
        if ("PERCENTAGE".equalsIgnoreCase(dto.getDiscountType())) {
            // Convert the percentage value back to display format
            // Since we store 1% as 0.01, we need to multiply by 100 for display
            double percent = dto.getDiscount_percent();
            discountValueText = percent + "% off";
        } else {
            discountValueText = dto.getDiscount_amount() + " MMK off";
        }

        String notificationMessage = "🔥 \"" + dto.getName() + "\" is live: " + discountValueText + "! Click here to view products.";
        String type = "discount";
        String link = "/userproductlist?discountId=" + discountId;

        userRepository.findAll().forEach(user -> {
            try {
                notificationService.createNotificationForUser(user.getEmail(), notificationMessage, type, link);
            } catch (Exception e) {
                System.err.println("[Notification] Failed to send notification to " + user.getEmail() + ": " + e.getMessage());
                e.printStackTrace();
            }
        });
    }

    // Remove only the specific conflict by targetType and targetId
    private void removeConflictingDiscountByTarget(String targetType, String targetId) {
        targetType = targetType.toUpperCase();
        try {
            switch (targetType) {
                case "BRAND":
                    // targetId is brandId
                    Long brandId = Long.parseLong(targetId);
                    removeConflictingBrandDiscounts(brandId);
                    // Also remove brand-category discounts for this brand
                    List<Category> categories = categoryRepository.findAllCategoryByBrandId(brandId);
                    for (Category category : categories) {
                        removeConflictingBrandCategoryDiscounts(brandId, category.getId());
                    }
                    break;
                case "CATEGORY":
                    // targetId is categoryId
                    Long categoryId = Long.parseLong(targetId);
                    removeConflictingCategoryDiscounts(categoryId);
                    // Also remove brand-category discounts for this category
                    List<Brand> brands = brandRepository.findAllBrandByCateId(categoryId);
                    for (Brand brand : brands) {
                        removeConflictingBrandCategoryDiscounts(brand.getId(), categoryId);
                    }
                    break;
                case "BRAND_CATEGORY":
                    // targetId is brandId-categoryId
                    String[] bcParts = targetId.split("-");
                    if (bcParts.length == 2) {
                        Long bId = Long.parseLong(bcParts[0]);
                        Long cId = Long.parseLong(bcParts[1]);
                        removeConflictingBrandCategoryDiscounts(bId, cId);
                    }
                    break;
                case "PRODUCT":
                    // targetId is productId
                    Long productId = Long.parseLong(targetId);
                    List<DiscountRule> rules = discountRuleRepository.findByProductIdAndDiscountStatusTrue(productId);
                    for (DiscountRule rule : rules) {
                        discountRuleRepository.delete(rule);
                    }
                    break;
                case "USER_BRAND":
                    // targetId is user-<userId>-brand-<brandId>
                    String[] ubParts = targetId.split("-");
                    if (ubParts.length == 4) {
                        Long userId = Long.parseLong(ubParts[1]);
                        Long bId = Long.parseLong(ubParts[3]);
                        discountRuleRepository.deleteByUserIdAndBrandId(userId, bId);
                    }
                    break;
                case "USER_CATEGORY":
                    // targetId is user-<userId>-category-<categoryId>
                    String[] ucParts = targetId.split("-");
                    if (ucParts.length == 4) {
                        Long userId = Long.parseLong(ucParts[1]);
                        Long cId = Long.parseLong(ucParts[3]);
                        discountRuleRepository.deleteByUserIdAndCategoryId(userId, cId);
                    }
                    break;
                case "USER_BRAND_CATEGORY":
                    // targetId is user-<userId>-brand-<brandId>-category-<categoryId>
                    String[] ubcParts = targetId.split("-");
                    if (ubcParts.length == 6) {
                        Long userId = Long.parseLong(ubcParts[1]);
                        Long bId = Long.parseLong(ubcParts[3]);
                        Long cId = Long.parseLong(ubcParts[5]);
                        discountRuleRepository.deleteByUserIdAndBrandIdAndCategoryId(userId, bId, cId);
                    }
                    break;
                case "USER_PRODUCT":
                    // targetId is user-<userId>-product-<productId>
                    String[] upParts = targetId.split("-");
                    if (upParts.length == 4) {
                        Long userId = Long.parseLong(upParts[1]);
                        Long pId = Long.parseLong(upParts[3]);
                        discountRuleRepository.deleteByUserIdAndProductId(userId, pId);
                    }
                    break;
                default:
                    // For other types, do nothing
                    break;
            }
        } catch (Exception e) {
            System.err.println("[Discount] Failed to remove conflict for targetType: " + targetType + ", targetId: " + targetId + ". Error: " + e.getMessage());
        }
    }

}