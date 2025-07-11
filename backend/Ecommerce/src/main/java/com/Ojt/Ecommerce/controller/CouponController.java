package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.CouponApplyRequest;
import com.Ojt.Ecommerce.dto.CouponApplyResponse;
import com.Ojt.Ecommerce.service.DiscountCouponService;
import com.Ojt.Ecommerce.service.DiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final DiscountCouponService discountCouponService;

    @PostMapping("/validate")
    public CouponApplyResponse validateCoupon(@RequestBody CouponApplyRequest request) {
        return discountCouponService.validateCoupon(request);
    }
}
