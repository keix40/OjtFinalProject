package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.DiscountRequestDTO;
import com.Ojt.Ecommerce.entity.*;
import com.Ojt.Ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiscountRuleServiceImpl implements DiscountRuleService {
    private final DiscountRuleRepository discountRuleRepository;
    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final VipTierRepository vipTierRepository;

    @Override
    public void createDiscountRules(DiscountRequestDTO dto, Discount discount) {
        String targetType = dto.getTargetType().toUpperCase();
        switch (targetType) {
            case "GLOBAL":
                createGlobalDiscountRule(discount);
                break;
            case "BRAND":
                if (dto.getBrandIds() != null && !dto.getBrandIds().trim().isEmpty()) {
                    String[] brandIds = dto.getBrandIds().split(",");
                    for (String brandIdStr : brandIds) {
                        Long brandId = Long.parseLong(brandIdStr.trim());
                        createBrandDiscountRule(brandId, discount);
                    }
                } else if (dto.getBrandId() != null) {
                    createBrandDiscountRule(dto.getBrandId(), discount);
                }
                break;
            case "CATEGORY":
                if (dto.getCategoryIds() != null && !dto.getCategoryIds().trim().isEmpty()) {
                    String[] categoryIds = dto.getCategoryIds().split(",");
                    for (String categoryIdStr : categoryIds) {
                        Long categoryId = Long.parseLong(categoryIdStr.trim());
                        createCategoryDiscountRule(categoryId, discount);
                    }
                } else if (dto.getCategoryId() != null) {
                    createCategoryDiscountRule(dto.getCategoryId(), discount);
                }
                break;
            case "PRODUCT":
                if (dto.getProductIds() != null && !dto.getProductIds().trim().isEmpty()) {
                    createProductDiscountRules(dto.getProductIds(), discount);
                }
                break;
            case "BRAND_CATEGORY":
                if (dto.getBrandCategoryIds() != null && !dto.getBrandCategoryIds().trim().isEmpty()) {
                    createBrandCategoryDiscountRules(dto.getBrandCategoryIds(), discount);
                } else if (dto.getBrandId() != null && dto.getCategoryId() != null) {
                    createBrandCategoryDiscountRule(dto.getBrandId(), dto.getCategoryId(), discount);
                }
                break;
            case "USER_GLOBAL":
                createUserGlobalDiscountRules(dto, discount);
                break;
            case "USER_BRAND":
                createUserBrandDiscountRules(dto, discount);
                break;
            case "USER_CATEGORY":
                createUserCategoryDiscountRules(dto, discount);
                break;
            case "USER_BRAND_CATEGORY":
                createUserBrandCategoryDiscountRules(dto, discount);
                break;
            case "USER_PRODUCT":
                createUserProductDiscountRules(dto, discount);
                break;
            case "VIP_TIER":
                createVipTierDiscountRules(dto, discount);
                break;
            default:
                throw new IllegalArgumentException("Invalid target type: " + targetType);
        }
    }

    @Override
    public void createUserDiscountRules(List<Long> userIds, Discount discount) {
        for (Long userId : userIds) {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
            DiscountRule rule = new DiscountRule();
            rule.setDiscount(discount);
            rule.setUser(user);
            rule.setTargetType(DiscountEventEnum.USER); // Use your enum for user-specific
            discountRuleRepository.save(rule);
        }
    }

    @Override
    public void createVipTierDiscountRules(List<Long> vipTierIds, Discount discount) {
        for (Long vipTierId : vipTierIds) {
            VipTier vipTier = vipTierRepository.findById(vipTierId)
                .orElseThrow(() -> new RuntimeException("VIP Tier not found: " + vipTierId));
            DiscountRule rule = new DiscountRule();
            rule.setDiscount(discount);
            rule.setVipTier(vipTier);
            rule.setTargetType(DiscountEventEnum.VIP_TIER); // Use your enum for VIP tier
            discountRuleRepository.save(rule);
        }
    }

    @Override
    public void createGlobalDiscountRule(Discount discount) {
        DiscountRule rule = new DiscountRule();
        rule.setDiscount(discount);
        rule.setTargetType(DiscountEventEnum.GLOBAL); // Use your enum for global
        discountRuleRepository.save(rule);
    }

    private void createBrandDiscountRule(Long brandId, Discount discount) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new RuntimeException("Brand not found with id: " + brandId));
        DiscountRule rule = new DiscountRule();
        rule.setTargetType(DiscountEventEnum.BRAND);
        rule.setDiscount(discount);
        rule.setBrand(brand);
        discountRuleRepository.save(rule);
    }

    private void createCategoryDiscountRule(Long categoryId, Discount discount) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

        if (category == null) {
            throw new RuntimeException("Category not found with id: " + categoryId);
        }

        DiscountRule rule = new DiscountRule();
        rule.setTargetType(DiscountEventEnum.CATEGORY);
        rule.setDiscount(discount);
        rule.setCategory(category);
        discountRuleRepository.save(rule);
    }

    private void createProductDiscountRules(String productIds, Discount discount) {
        String[] ids = productIds.split(",");
        for (String idStr : ids) {
            Long productId = Long.parseLong(idStr.trim());
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
            DiscountRule rule = new DiscountRule();
            rule.setTargetType(DiscountEventEnum.PRODUCT);
            rule.setDiscount(discount);
            rule.setProduct(product);
            discountRuleRepository.save(rule);
        }
    }

    private void createBrandCategoryDiscountRule(Long brandId, Long categoryId, Discount discount) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new RuntimeException("Brand not found with id: " + brandId));
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));
        DiscountRule rule = new DiscountRule();
        rule.setTargetType(DiscountEventEnum.BRAND_CATEGORY);
        rule.setDiscount(discount);
        rule.setBrand(brand);
        rule.setCategory(category);
        discountRuleRepository.save(rule);
    }

    private void createBrandCategoryDiscountRules(String brandCategoryIds, Discount discount) {
        String[] ids = brandCategoryIds.split(",");
        for (String idStr : ids) {
            String[] parts = idStr.trim().split("-");
            if (parts.length == 2) {
                Long brandId = Long.parseLong(parts[0]);
                Long categoryId = Long.parseLong(parts[1]);
                createBrandCategoryDiscountRule(brandId, categoryId, discount);
            }
        }
    }

    private void createUserBrandDiscountRules(DiscountRequestDTO dto, Discount discount) {
        System.out.println("[DiscountRuleService] Entered createUserBrandDiscountRules.");
        if (dto.getUserIds() == null || dto.getUserIds().trim().isEmpty() ||
            dto.getBrandIds() == null || dto.getBrandIds().trim().isEmpty()) {
            System.out.println("[DiscountRuleService] Missing userIds or brandIds. Skipping.");
            return;
        }

        String[] userIds = dto.getUserIds().split(",");
        String[] brandIds = dto.getBrandIds().split(",");

        for (String userIdStr : userIds) {
            Long userId = Long.parseLong(userIdStr.trim());
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

            for (String brandIdStr : brandIds) {
                Long brandId = Long.parseLong(brandIdStr.trim());
                Brand brand = brandRepository.findById(brandId)
                        .orElseThrow(() -> new RuntimeException("Brand not found with id: " + brandId));

                DiscountRule rule = new DiscountRule();
                rule.setTargetType(DiscountEventEnum.USER_BRAND);
                rule.setDiscount(discount);
                rule.setUser(user);
                rule.setBrand(brand);

                try {
                    System.out.println("[DiscountRuleService] Attempting to save USER_BRAND rule: " + rule);
                    discountRuleRepository.save(rule);
                    System.out.println("[DiscountRuleService] Successfully saved USER_BRAND rule.");
                } catch (Exception e) {
                    System.err.println("[DiscountRuleService] ERROR saving USER_BRAND rule: " + rule);
                    e.printStackTrace();
                }
            }
        }
    }

    private void createUserCategoryDiscountRules(DiscountRequestDTO dto, Discount discount) {
        if (dto.getUserIds() == null || dto.getUserIds().trim().isEmpty() ||
            dto.getCategoryIds() == null || dto.getCategoryIds().trim().isEmpty()) {
            return;
        }

        String[] userIds = dto.getUserIds().split(",");
        String[] categoryIds = dto.getCategoryIds().split(",");

        for (String userIdStr : userIds) {
            Long userId = Long.parseLong(userIdStr.trim());
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

            for (String categoryIdStr : categoryIds) {
                Long categoryId = Long.parseLong(categoryIdStr.trim());
                Category category = categoryRepository.findById(categoryId)
                        .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

                DiscountRule rule = new DiscountRule();
                rule.setTargetType(DiscountEventEnum.USER_CATEGORY);
                rule.setDiscount(discount);
                rule.setUser(user);
                rule.setCategory(category);
                discountRuleRepository.save(rule);
            }
        }
    }

    private void createUserBrandCategoryDiscountRules(DiscountRequestDTO dto, Discount discount) {
        if (dto.getUserIds() == null || dto.getUserIds().trim().isEmpty() ||
            dto.getBrandCategoryIds() == null || dto.getBrandCategoryIds().trim().isEmpty()) {
            return;
        }

        String[] userIds = dto.getUserIds().split(",");
        String[] brandCategoryIds = dto.getBrandCategoryIds().split(",");

        for (String userIdStr : userIds) {
            Long userId = Long.parseLong(userIdStr.trim());
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

            for (String brandCategoryIdStr : brandCategoryIds) {
                String[] parts = brandCategoryIdStr.trim().split("-");
                if (parts.length == 2) {
                    Long brandId = Long.parseLong(parts[0]);
                    Long categoryId = Long.parseLong(parts[1]);

                    Brand brand = brandRepository.findById(brandId)
                            .orElseThrow(() -> new RuntimeException("Brand not found with id: " + brandId));
                    Category category = categoryRepository.findById(categoryId)
                            .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

                    DiscountRule rule = new DiscountRule();
                    rule.setTargetType(DiscountEventEnum.USER_BRAND_CATEGORY);
                    rule.setDiscount(discount);
                    rule.setUser(user);
                    rule.setBrand(brand);
                    rule.setCategory(category);
                    discountRuleRepository.save(rule);
                }
            }
        }
    }

    private void createUserProductDiscountRules(DiscountRequestDTO dto, Discount discount) {
        if (dto.getUserIds() == null || dto.getUserIds().trim().isEmpty() ||
            dto.getProductIds() == null || dto.getProductIds().trim().isEmpty()) {
            return;
        }

        String[] userIds = dto.getUserIds().split(",");
        String[] productIds = dto.getProductIds().split(",");

        for (String userIdStr : userIds) {
            Long userId = Long.parseLong(userIdStr.trim());
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

            for (String productIdStr : productIds) {
                Long productId = Long.parseLong(productIdStr.trim());
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

                DiscountRule rule = new DiscountRule();
                rule.setTargetType(DiscountEventEnum.USER_PRODUCT);
                rule.setDiscount(discount);
                rule.setUser(user);
                rule.setProduct(product);
                discountRuleRepository.save(rule);
            }
        }
    }

    private void createUserGlobalDiscountRules(DiscountRequestDTO dto, Discount discount) {
        // Handle multiple user IDs as comma-separated string (new functionality)
        if (dto.getUserIds() != null && !dto.getUserIds().trim().isEmpty()) {
            String[] userIdStrings = dto.getUserIds().split(",");
            for (String userIdStr : userIdStrings) {
                Long userId = Long.parseLong(userIdStr.trim());
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("user id not found: " + userId));
                DiscountRule rule = new DiscountRule();
                rule.setTargetType(DiscountEventEnum.USER_GLOBAL);
                rule.setDiscount(discount);
                rule.setUser(user);
                discountRuleRepository.save(rule);
            }
        }
        
        // Handle VIP tier IDs if present
        if (dto.getVipTierIds() != null && !dto.getVipTierIds().trim().isEmpty()) {
            String[] vipTierIdStrings = dto.getVipTierIds().split(",");
            for (String vipTierIdStr : vipTierIdStrings) {
                Long vipTierId = Long.parseLong(vipTierIdStr.trim());
                VipTier vipTier = vipTierRepository.findById(vipTierId)
                    .orElseThrow(() -> new RuntimeException("VIP Tier not found: " + vipTierId));
                DiscountRule rule = new DiscountRule();
                rule.setTargetType(DiscountEventEnum.USER_GLOBAL);
                rule.setDiscount(discount);
                rule.setVipTier(vipTier);
                discountRuleRepository.save(rule);
            }
        }
    }

    private void createVipTierDiscountRules(DiscountRequestDTO dto, Discount discount) {
        // Handle multiple VIP tier IDs as comma-separated string (new functionality)
        if (dto.getVipTierIds() != null && !dto.getVipTierIds().trim().isEmpty()) {
            String[] vipTierIdStrings = dto.getVipTierIds().split(",");
            for (String vipTierIdStr : vipTierIdStrings) {
                Long vipTierId = Long.parseLong(vipTierIdStr.trim());
                
                VipTier vipTier = vipTierRepository.findById(vipTierId)
                    .orElseThrow(() -> new RuntimeException("VIP Tier not found: " + vipTierId));
                
                DiscountRule rule = new DiscountRule();
                rule.setTargetType(DiscountEventEnum.VIP_TIER);
                rule.setDiscount(discount);
                rule.setVipTier(vipTier);
                discountRuleRepository.save(rule);
            }
        }
        // Handle single VIP tier ID (backward compatibility)
        else if (dto.getVipTierId() != null && !dto.getVipTierId().trim().isEmpty()) {
            VipTier vipTier = vipTierRepository.findById(Long.parseLong(dto.getVipTierId().trim()))
                .orElseThrow(() -> new RuntimeException("VIP Tier not found: " + dto.getVipTierId()));
            
            DiscountRule rule = new DiscountRule();
            rule.setTargetType(DiscountEventEnum.VIP_TIER);
            rule.setDiscount(discount);
            rule.setVipTier(vipTier);
            discountRuleRepository.save(rule);
        }
    }
} 