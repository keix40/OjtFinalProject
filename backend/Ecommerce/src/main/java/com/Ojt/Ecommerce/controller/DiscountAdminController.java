package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.annotations.RequiresPermission;
import com.Ojt.Ecommerce.dto.CouponApplyRequest;
import com.Ojt.Ecommerce.dto.CouponApplyResponse;
import com.Ojt.Ecommerce.dto.DiscountEventResponseDTO;
import com.Ojt.Ecommerce.dto.DiscountRequestDTO;
import com.Ojt.Ecommerce.repository.DiscountRepository;
import com.Ojt.Ecommerce.service.DiscountCouponService;
import com.Ojt.Ecommerce.service.DiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import static com.Ojt.Ecommerce.constants.PermissionConstants.*;
import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;

@PermissionCategoryTag(value = "discounts", name = "Discount Management", icon = "fa-percent")
@RestController
@RequestMapping("/api/admin/discounts")
@RequiredArgsConstructor
public class DiscountAdminController {

    private final DiscountCouponService discountCouponService;
    private final DiscountRepository discountRepository;

    @PostMapping
    @RequiresPermission(value = DISCOUNTS_CREATE, level = "advanced")
    public DiscountEventResponseDTO create(@RequestBody DiscountRequestDTO dto) {
        return discountCouponService.createDiscount(dto);
    }

    @GetMapping("/{id}")
    @RequiresPermission(value = DISCOUNTS_VIEW, level = "basic")
    public DiscountEventResponseDTO get(@PathVariable Long id) {
        return discountCouponService.getDiscount(id);
    }

    @GetMapping
    @RequiresPermission(value = DISCOUNTS_VIEW, level = "basic")
    public List<DiscountEventResponseDTO> getAll() {
        return discountCouponService.getAllDiscounts();
    }

    @PutMapping("/{id}")
    @RequiresPermission(value = DISCOUNTS_UPDATE, level = "advanced")
    public DiscountEventResponseDTO update(@PathVariable Long id, @RequestBody DiscountRequestDTO dto) {
        return discountCouponService.updateDiscount(id, dto);
    }

    @GetMapping("/check-code")
    @RequiresPermission(value = DISCOUNTS_VIEW, level = "basic")
    public ResponseEntity<Boolean> checkCodeExists(@RequestParam String code) {
        boolean exists = discountRepository.existsByCode(code);
        return ResponseEntity.ok(exists);
    }

    @DeleteMapping("/{id}")
    @RequiresPermission(value = DISCOUNTS_DELETE, level = "critical")
    public void delete(@PathVariable Long id) {
        discountCouponService.deleteDiscount(id);
    }

}
