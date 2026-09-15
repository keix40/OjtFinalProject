package com.Ojt.Ecommerce.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Ojt.Ecommerce.dto.TrendingProductDTO;
import com.Ojt.Ecommerce.service.ProductService;

/**
 * Dev-only debug endpoints. Not registered when {@code prod} profile is active (Render production).
 */
@Profile("!prod")
@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/product/debug")
public class ProductDebugController {

    @Autowired
    private ProductService service;

    @GetMapping("/discounts")
    public ResponseEntity<Map<String, Object>> debugDiscounts() {
        try {
            Map<String, Object> debugInfo = new HashMap<>();
            java.time.LocalDate today = java.time.LocalDate.now();

            List<com.Ojt.Ecommerce.entity.Discount> allDiscounts = service.getAllDiscounts();
            List<Map<String, Object>> activeDiscounts = new ArrayList<>();

            for (com.Ojt.Ecommerce.entity.Discount discount : allDiscounts) {
                Map<String, Object> discountInfo = new HashMap<>();
                discountInfo.put("id", discount.getId());
                discountInfo.put("name", discount.getName());
                discountInfo.put("status", discount.isStatus());
                discountInfo.put("startDate", discount.getStartDate());
                discountInfo.put("endDate", discount.getEndDate());
                discountInfo.put("discountValue", discount.getDiscountValue());
                discountInfo.put("discountType", discount.getDiscountType());

                boolean isActive = discount.isStatus()
                        && discount.getStartDate() != null
                        && discount.getEndDate() != null
                        && today.isAfter(discount.getStartDate().minusDays(1))
                        && today.isBefore(discount.getEndDate().plusDays(1));

                discountInfo.put("isActive", isActive);

                if (isActive) {
                    activeDiscounts.add(discountInfo);
                }
            }

            debugInfo.put("today", today.toString());
            debugInfo.put("totalDiscounts", allDiscounts.size());
            debugInfo.put("activeDiscounts", activeDiscounts);
            debugInfo.put("activeDiscountCount", activeDiscounts.size());

            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/products-with-discounts")
    public ResponseEntity<Map<String, Object>> debugProductsWithDiscounts() {
        try {
            Map<String, Object> debugInfo = new HashMap<>();

            List<TrendingProductDTO> trendingProducts = service.getTrendingProductsWithReviews();
            List<Map<String, Object>> trendingWithDiscounts = new ArrayList<>();

            for (TrendingProductDTO product : trendingProducts) {
                if (product.getHasDiscount()) {
                    Map<String, Object> productInfo = new HashMap<>();
                    productInfo.put("id", product.getId());
                    productInfo.put("name", product.getProductName());
                    productInfo.put("hasDiscount", product.getHasDiscount());
                    productInfo.put("discountName", product.getDiscountName());
                    productInfo.put("discountValue", product.getDiscountValue());
                    productInfo.put("discountType", product.getDiscountType());
                    productInfo.put("hasEvent", product.getHasEvent());
                    productInfo.put("eventName", product.getEventName());
                    trendingWithDiscounts.add(productInfo);
                }
            }

            List<TrendingProductDTO> featuredProducts = service.getPersonalizedFeaturedProducts(null);
            List<Map<String, Object>> featuredWithDiscounts = new ArrayList<>();

            for (TrendingProductDTO product : featuredProducts) {
                if (product.getHasDiscount()) {
                    Map<String, Object> productInfo = new HashMap<>();
                    productInfo.put("id", product.getId());
                    productInfo.put("name", product.getProductName());
                    productInfo.put("hasDiscount", product.getHasDiscount());
                    productInfo.put("discountName", product.getDiscountName());
                    productInfo.put("discountValue", product.getDiscountValue());
                    productInfo.put("discountType", product.getDiscountType());
                    productInfo.put("hasEvent", product.getHasEvent());
                    productInfo.put("eventName", product.getEventName());
                    featuredWithDiscounts.add(productInfo);
                }
            }

            debugInfo.put("trendingProductsWithDiscounts", trendingWithDiscounts);
            debugInfo.put("featuredProductsWithDiscounts", featuredWithDiscounts);
            debugInfo.put("trendingDiscountCount", trendingWithDiscounts.size());
            debugInfo.put("featuredDiscountCount", featuredWithDiscounts.size());

            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
