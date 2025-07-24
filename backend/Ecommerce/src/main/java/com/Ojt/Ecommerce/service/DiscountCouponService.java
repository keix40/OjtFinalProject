package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.CouponApplyRequest;
import com.Ojt.Ecommerce.dto.CouponApplyResponse;
import com.Ojt.Ecommerce.dto.DiscountEventResponseDTO;
import com.Ojt.Ecommerce.dto.DiscountRequestDTO;
import com.Ojt.Ecommerce.entity.*;
import com.Ojt.Ecommerce.exception.CustomException;
import com.Ojt.Ecommerce.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiscountCouponService {

    private final DiscountRepository discountRepository;
    private final ProductRepository productRepository;
    private final ProductDiscountRepository productDiscountRepository;
    private final DiscountRuleRepository discountRuleRepository;
    private final UserCouponUsageRepository userCouponUsageRepository;


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
                .startDate(dto.getStartDate().toLocalDate())
                .endDate(dto.getEndDate().toLocalDate())
                .autoApply(false)
                .status(dto.isStatus())
                .build();
        System.out.println("status saved:" + discount.isStatus());
        // Link to discount event if provided
        Discount saved = discountRepository.save(discount);

        if (dto.getProductIdsforCoupon() != null && !dto.getProductIdsforCoupon().isEmpty()) {
            List<DiscountRule> rules = dto.getProductIdsforCoupon().stream().map(productId -> {
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

                DiscountRule rule = new DiscountRule();
                rule.setDiscount(saved);
                rule.setTargetType(DiscountEventEnum.PRODUCT);
                rule.setProduct(product);
                rule.setStartDate(dto.getStartDate().toLocalDate());
                rule.setEndDate(dto.getEndDate().toLocalDate());
                return rule;
            }).toList();

            discountRuleRepository.saveAll(rules);
        }

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
                .orElseThrow(() -> new CustomException("Coupon not found"));

        if (!Boolean.FALSE.equals(discount.getAutoApply())) {
            throw new CustomException("This is not a coupon, it's auto-applied.");
        }

        LocalDate today = LocalDate.now();
        if (today.isBefore(discount.getStartDate()) || today.isAfter(discount.getEndDate())) {
            return new CouponApplyResponse(false, "Coupon is expired or not yet active", 0.0);
        }

        if (!discount.isStatus()) {
            return new CouponApplyResponse(false, "Coupon is inactive", 0.0);
        }

        // Check if already used
        boolean alreadyUsed = userCouponUsageRepository
                .existsByUserIdAndDiscountId(request.getUserId(), discount.getId());
        if (alreadyUsed) {
            return new CouponApplyResponse(false, "Coupon already used", 0.0);
        }

        // Check if coupon is linked to specific products
        List<DiscountRule> productDiscounts = discount.getDiscountRules();
        if (!productDiscounts.isEmpty() && request.getProductIds() != null) {
            boolean matches = productDiscounts.stream()
                    .anyMatch(pd -> pd.getProduct() != null && request.getProductIds().contains(pd.getProduct().getId()));
            if (!matches) {
                return new CouponApplyResponse(false, "Coupon not applicable to selected products", 0.0);
            }
        }

        return new CouponApplyResponse(true, "Coupon is valid", discount.getDiscountValue());
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
}
