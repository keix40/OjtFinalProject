package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.DiscountRequestDTO;
import com.Ojt.Ecommerce.entity.Discount;
import java.util.List;
 
public interface DiscountRuleService {
    void createDiscountRules(DiscountRequestDTO dto, Discount discount);
    void createUserDiscountRules(List<Long> userIds, Discount discount);
    void createVipTierDiscountRules(List<Long> vipTierIds, Discount discount);
    void createGlobalDiscountRule(Discount discount);
} 