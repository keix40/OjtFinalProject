package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.CouponApplyRequest;
import com.Ojt.Ecommerce.dto.CouponApplyResponse;
import com.Ojt.Ecommerce.dto.DiscountRequestDTO;
import com.Ojt.Ecommerce.dto.DiscountResponseDTO;
import com.Ojt.Ecommerce.service.DiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/discounts")
@RequiredArgsConstructor
public class DiscountAdminController {

    private final DiscountService discountService;

    @PostMapping
    public DiscountResponseDTO create(@RequestBody DiscountRequestDTO dto) {
        return discountService.createDiscount(dto);
    }

    @GetMapping("/{id}")
    public DiscountResponseDTO get(@PathVariable Long id) {
        return discountService.getDiscount(id);
    }

    @GetMapping
    public List<DiscountResponseDTO> getAll() {
        return discountService.getAllDiscounts();
    }

    @PutMapping("/{id}")
    public DiscountResponseDTO update(@PathVariable Long id, @RequestBody DiscountRequestDTO dto) {
        return discountService.updateDiscount(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        discountService.deleteDiscount(id);
    }

}
