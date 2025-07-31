package com.Ojt.Ecommerce.service;

import java.util.List;

import org.springframework.http.ResponseEntity;

import com.Ojt.Ecommerce.dto.DiscountDTO;
import com.Ojt.Ecommerce.dto.DiscountRequestDTO;

public interface DiscountService {
    ResponseEntity<?> createDiscount(DiscountRequestDTO dto);
    ResponseEntity<?> createDiscountWithResolution(DiscountRequestDTO dto, String resolutionChoice);
    ResponseEntity<?> createDiscountWithResolution(DiscountRequestDTO dto, List<List<String>> conflictResolutions);
    ResponseEntity<?> checkDuplicateDiscount(DiscountRequestDTO dto);
    ResponseEntity<?> getActiveDiscounts();
    List<DiscountDTO> getAllDiscounts();
    List<DiscountDTO> getActiveAliveDiscounts(); // New method for active and alive discounts
    com.Ojt.Ecommerce.entity.Discount updateDiscount(Long id, DiscountRequestDTO dto);
    ResponseEntity<?> getDiscountsByProduct(Long productId);
    ResponseEntity<?> getDiscountById(Long id);
}