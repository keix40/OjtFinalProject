package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.DiscountDTO;
import com.Ojt.Ecommerce.dto.DiscountRequestDTO;
import com.Ojt.Ecommerce.entity.Discount;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;

public interface DiscountService {
    ResponseEntity<?> createDiscount(DiscountRequestDTO dto);
    ResponseEntity<?> createDiscountWithResolution(DiscountRequestDTO dto, String resolutionChoice);
    ResponseEntity<?> createDiscountWithResolution(DiscountRequestDTO dto, List<List<String>> conflictResolutions);
    ResponseEntity<?> checkDuplicateDiscount(DiscountRequestDTO dto);
    ResponseEntity<?> getActiveDiscounts();
    List<DiscountDTO> getAllDiscounts();
    ResponseEntity<?> updateDiscount(Long id, DiscountRequestDTO dto);
    ResponseEntity<?> getDiscountsByProduct(Long productId);
}