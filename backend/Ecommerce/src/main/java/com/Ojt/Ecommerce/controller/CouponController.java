package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.CouponApplyRequest;
import com.Ojt.Ecommerce.dto.CouponApplyResponse;
import com.Ojt.Ecommerce.dto.DiscountRequestDTO;
import com.Ojt.Ecommerce.dto.UserCouponDTO;
import com.Ojt.Ecommerce.entity.Discount;
import com.Ojt.Ecommerce.repository.DiscountRepository;
import com.Ojt.Ecommerce.service.DiscountCouponService;
import com.Ojt.Ecommerce.service.DiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final DiscountRepository discountRepository;
    private final DiscountCouponService discountCouponService;

    @PostMapping("/validate")
    public CouponApplyResponse validateCoupon(@RequestBody CouponApplyRequest request) {
        return discountCouponService.validateCoupon(request);
    }

    @GetMapping("/min-spend")
    public ResponseEntity<?> getMinimumSpend(@RequestParam String couponCode) {
        Discount discount = discountRepository.findByCode(couponCode).orElse(null);
        if (discount == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid promo code");
        }
        Double minSpend = discount.getMinimumSpend(); // or getMinimumAmount(), etc.
        return ResponseEntity.ok(Map.of("minSpend", minSpend != null ? minSpend : 0));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserCouponDTO>> getUserCoupons(@PathVariable Long userId) {
        List<UserCouponDTO> userCoupons = discountCouponService.getUserCoupons(userId);
        return ResponseEntity.ok(userCoupons);
    }
}

