package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.CouponApplyRequest;
import com.Ojt.Ecommerce.dto.CouponApplyResponse;
import com.Ojt.Ecommerce.dto.DiscountRequestDTO;
import com.Ojt.Ecommerce.dto.DiscountResponseDTO;
import com.Ojt.Ecommerce.entity.Discount;
import com.Ojt.Ecommerce.entity.DiscountEvent;
import com.Ojt.Ecommerce.entity.DiscountType;
import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.entity.ProductDiscount;
import com.Ojt.Ecommerce.exception.CustomException;
import com.Ojt.Ecommerce.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiscountService {

    private final DiscountRepository discountRepository;
    private final ProductRepository productRepository;
    private final ProductDiscountRepository productDiscountRepository;
    private final DiscountEventRepository discountEventRepository;
    private final UserCouponUsageRepository userCouponUsageRepository;


    @Transactional
    public DiscountResponseDTO createDiscount(DiscountRequestDTO dto) {
        Discount discount = Discount.builder()
                .name(dto.getName())
                .code(dto.getCode())
                .discountType(dto.getDiscountType())
                .discountValue(dto.getDiscountValue())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .autoApply(dto.getAutoApply())
                .status(1)
                .build();

        // Link to discount event if provided
        if (dto.getDiscountEventId() != null) {
            DiscountEvent event = discountEventRepository.findById(dto.getDiscountEventId())
                    .orElseThrow(() -> new RuntimeException("Discount Event not found"));
            discount.setDiscountEvent(event);
        }

        Discount saved = discountRepository.save(discount);

        // Link to selected products
        if (dto.getProductIds() != null) {
            List<ProductDiscount> links = dto.getProductIds().stream().map(productId -> {
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Product not found: " + productId));
                return ProductDiscount.builder()
                        .product(product)
                        .discount(saved)
                        .build();
            }).toList();

            productDiscountRepository.saveAll(links);
        }

        return mapToDTO(saved, dto.getProductIds());
    }

    public DiscountResponseDTO getDiscount(Long id) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Discount not found"));

        List<Long> productIds = discount.getProductDiscounts().stream()
                .map(pd -> pd.getProduct().getId())
                .toList();

        return mapToDTO(discount, productIds);
    }

    public List<DiscountResponseDTO> getAllDiscounts() {
        return discountRepository.findAll().stream()
                .map(discount -> {
                    List<Long> productIds = discount.getProductDiscounts().stream()
                            .map(pd -> pd.getProduct().getId())
                            .toList();
                    return mapToDTO(discount, productIds);
                }).toList();
    }

    @Transactional
    public DiscountResponseDTO updateDiscount(Long id, DiscountRequestDTO dto) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Discount not found"));

        discount.setName(dto.getName());
        discount.setCode(dto.getCode());
        discount.setDiscountType(dto.getDiscountType());
        discount.setDiscountValue(dto.getDiscountValue());
        discount.setStartDate(dto.getStartDate());
        discount.setEndDate(dto.getEndDate());
        discount.setAutoApply(dto.getAutoApply());

        // Update or remove event
        if (dto.getDiscountEventId() != null) {
            DiscountEvent event = discountEventRepository.findById(dto.getDiscountEventId())
                    .orElseThrow(() -> new RuntimeException("Discount Event not found"));
            discount.setDiscountEvent(event);
        } else {
            discount.setDiscountEvent(null);
        }

        // Remove old product links
        productDiscountRepository.deleteAll(discount.getProductDiscounts());

        // Re-assign products
        if (dto.getProductIds() != null) {
            List<ProductDiscount> links = dto.getProductIds().stream().map(productId -> {
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Product not found: " + productId));
                return ProductDiscount.builder()
                        .product(product)
                        .discount(discount)
                        .build();
            }).toList();

            productDiscountRepository.saveAll(links);
        }

        return mapToDTO(discount, dto.getProductIds());
    }

    @Transactional
    public void deleteDiscount(Long id) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Discount not found"));
        discount.setStatus(0); // soft delete
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

        if (discount.getStatus() != 1) {
            return new CouponApplyResponse(false, "Coupon is inactive", 0.0);
        }

        // Check if already used
        boolean alreadyUsed = userCouponUsageRepository
                .existsByUserIdAndDiscountId(request.getUserId(), discount.getId());
        if (alreadyUsed) {
            return new CouponApplyResponse(false, "Coupon already used", 0.0);
        }

        // Check if coupon is linked to specific products
        List<ProductDiscount> productDiscounts = discount.getProductDiscounts();
        if (!productDiscounts.isEmpty() && request.getProductIds() != null) {
            boolean matches = productDiscounts.stream()
                    .anyMatch(pd -> request.getProductIds().contains(pd.getProduct().getId()));
            if (!matches) {
                return new CouponApplyResponse(false, "Coupon not applicable to selected products", 0.0);
            }
        }

        return new CouponApplyResponse(true, "Coupon is valid", discount.getDiscountValue());
    }


    private DiscountResponseDTO mapToDTO(Discount discount, List<Long> productIds) {
        DiscountResponseDTO dto = new DiscountResponseDTO();
        dto.setId(discount.getId());
        dto.setName(discount.getName());
        dto.setCode(discount.getCode());
        dto.setDiscountType(discount.getDiscountType());
        dto.setDiscountValue(discount.getDiscountValue());
        dto.setStartDate(discount.getStartDate());
        dto.setEndDate(discount.getEndDate());
        dto.setAutoApply(discount.getAutoApply());
        dto.setDiscountEventId(discount.getDiscountEvent() != null
                ? discount.getDiscountEvent().getId()
                : null);
        dto.setProductIds(productIds);
        return dto;
    }
}
