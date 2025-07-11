package com.Ojt.Ecommerce.controller;

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

@RestController
@RequestMapping("/api/admin/discounts")
@RequiredArgsConstructor
public class DiscountAdminController {

    private final DiscountCouponService discountCouponService;
    private final DiscountRepository discountRepository;

    @PostMapping
    public DiscountEventResponseDTO create(@RequestBody DiscountRequestDTO dto) {
        return discountCouponService.createDiscount(dto);
    }

    @GetMapping("/{id}")
    public DiscountEventResponseDTO get(@PathVariable Long id) {
        return discountCouponService.getDiscount(id);
    }

    @GetMapping
    public List<DiscountEventResponseDTO> getAll() {
        return discountCouponService.getAllDiscounts();
    }

    @PutMapping("/{id}")
    public DiscountEventResponseDTO update(@PathVariable Long id, @RequestBody DiscountRequestDTO dto) {
        return discountCouponService.updateDiscount(id, dto);
    }

    @GetMapping("/check-code")
    public ResponseEntity<Boolean> checkCodeExists(@RequestParam String code) {
        boolean exists = discountRepository.existsByCode(code);
        return ResponseEntity.ok(exists);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        discountCouponService.deleteDiscount(id);
    }

}
