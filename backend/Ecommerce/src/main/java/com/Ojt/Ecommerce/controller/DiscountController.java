package com.Ojt.Ecommerce.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Ojt.Ecommerce.annotations.LogActivity;
import com.Ojt.Ecommerce.dto.DiscountDTO;
import com.Ojt.Ecommerce.dto.DiscountRequestDTO;
import com.Ojt.Ecommerce.repository.DiscountRepository;
import com.Ojt.Ecommerce.service.DiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/discounts")
@RequiredArgsConstructor
public class DiscountController {
    private final DiscountService discountService;
    private final DiscountRepository discountRepository;

    @LogActivity(actionType = "CREATE", entityType = "DISCOUNT", description = "Created discount", severityLevel = "MEDIUM")
    @PostMapping("/create")
    public ResponseEntity<?> createDiscount(@RequestBody DiscountRequestDTO dto) {
        return discountService.createDiscount(dto);
    }

    @PostMapping("/create-with-resolution")
    public ResponseEntity<?> createDiscountWithResolution(@RequestBody Map<String, Object> request) {
        // Parse DiscountRequestDTO fields from the request map
        DiscountRequestDTO dto = new DiscountRequestDTO();
        dto.setName((String) request.get("name"));
        dto.setDescription((String) request.get("description"));
        dto.setDiscountType((String) request.get("discountType"));
        dto.setDiscount_percent(request.get("discount_percent") != null ? Double.parseDouble(request.get("discount_percent").toString()) : 0);
        dto.setDiscount_amount(request.get("discount_amount") != null ? Double.parseDouble(request.get("discount_amount").toString()) : 0);
        dto.setStartDate(java.time.LocalDateTime.parse(((String) request.get("startDate")).replace("Z", "")));
        dto.setEndDate(java.time.LocalDateTime.parse(((String) request.get("endDate")).replace("Z", "")));
        dto.setStatus(request.get("status") != null && Boolean.parseBoolean(request.get("status").toString()));
        // If your DTO has setIsEvent, use it; otherwise, set via setIsEvent or setEvent as appropriate
        if (request.get("isEvent") != null) {
            try {
                dto.getClass().getMethod("setIsEvent", boolean.class).invoke(dto, Boolean.parseBoolean(request.get("isEvent").toString()));
            } catch (Exception e) {
                // ignore if method doesn't exist
            }
        }
        dto.setTargetType((String) request.get("targetType"));
        dto.setProductIds((String) request.get("productIds"));
        dto.setBrandIds((String) request.get("brandIds"));
        dto.setCategoryIds((String) request.get("categoryIds"));
        dto.setBrandCategoryIds((String) request.get("brandCategoryIds"));
        dto.setUserIds((String) request.get("userIds"));
        dto.setVipTierIds((String) request.get("vipTierIds"));


        // You can add more fields as needed

        // Parse conflictResolutions
        List<List<String>> conflictResolutions = null;
        Object conflictResolutionsObj = request.get("conflictResolutions");
        if (conflictResolutionsObj instanceof List) {
            conflictResolutions = (List<List<String>>) conflictResolutionsObj;
        }
        return discountService.createDiscountWithResolution(dto, conflictResolutions);
    }

    @PostMapping("/check-duplicate")
    public ResponseEntity<?> checkDuplicateDiscount(@RequestBody DiscountRequestDTO dto) {
        return discountService.checkDuplicateDiscount(dto);
    }

    @LogActivity(actionType = "UPDATE", entityType = "DISCOUNT", description = "Updated discount", severityLevel = "MEDIUM", entityIdParam = "id", logChanges = true)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDiscount(@PathVariable Long id, @RequestBody DiscountRequestDTO dto) {
        com.Ojt.Ecommerce.entity.Discount updatedDiscount = discountService.updateDiscount(id, dto);
        return ResponseEntity.ok(updatedDiscount);
    }

    @GetMapping
    public List<DiscountDTO> getAllDiscounts(){
        return discountService.getAllDiscounts();
    }

    @GetMapping("/active-alive")
    public List<DiscountDTO> getActiveAliveDiscounts(){
        return discountService.getActiveAliveDiscounts();
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveDiscounts(){
        return discountService.getActiveDiscounts();
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getDiscountsByProduct(@PathVariable Long productId){
        return discountService.getDiscountsByProduct(productId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDiscountById(@PathVariable Long id) {
        return discountService.getDiscountById(id);
    }

    @GetMapping("/min-spend")
    public ResponseEntity<?> getMinimumSpend(@RequestParam String couponCode) {
        var discount = discountRepository.findByCode(couponCode).orElse(null);
        if (discount == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid promo code");
        }
        Double minSpend = discount.getMinimumSpend();
        return ResponseEntity.ok(Map.of("minSpend", minSpend));
    }

    @LogActivity(actionType = "DELETE", entityType = "DISCOUNT", description = "", severityLevel = "HIGH", entityIdParam = "id")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDiscount(@PathVariable Long id) {
        discountRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
} 