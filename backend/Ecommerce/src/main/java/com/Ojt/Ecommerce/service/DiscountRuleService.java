package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.DiscountRequestDTO;
import com.Ojt.Ecommerce.entity.Discount;
 
public interface DiscountRuleService {
    void createDiscountRules(DiscountRequestDTO dto, Discount discount);
} 