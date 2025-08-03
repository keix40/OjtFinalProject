package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.entity.RevenueTarget;
import com.Ojt.Ecommerce.service.RevenueTargetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.Ojt.Ecommerce.annotations.LogActivity;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/target")
@CrossOrigin(origins = "http://localhost:4200")
public class RevenueTargetController {
    @Autowired
    private RevenueTargetService revenueTargetService;

    @Autowired
    private com.Ojt.Ecommerce.repository.RevenueTargetRepository revenueTargetRepository;

    @GetMapping
    public ResponseEntity<?> getTarget(@RequestParam String periodType, @RequestParam String periodValue) {
        Optional<RevenueTarget> target = revenueTargetService.getTarget(periodType, periodValue);
        if (target.isPresent()) {
            return ResponseEntity.ok(target.get());
        } else {
            return ResponseEntity.ok(Map.of("targetAmount", 0));
        }
    }

    @LogActivity(actionType = "CREATE", entityType = "REVENUE_TARGET", description = "Created revenue target", severityLevel = "MEDIUM")
    @PostMapping
    public ResponseEntity<?> setTarget(@RequestBody Map<String, Object> payload) {
        try {
            String periodType = (String) payload.get("periodType");
            String periodValue = (String) payload.get("periodValue");
            
            Object targetAmountObj = payload.get("targetAmount");
            if (targetAmountObj == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "targetAmount is required"));
            }
            
            Double targetAmount = Double.valueOf(targetAmountObj.toString());
            RevenueTarget target = revenueTargetService.setTarget(periodType, periodValue, targetAmount);
            return ResponseEntity.ok(target);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid targetAmount format"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to set target: " + e.getMessage()));
        }
    }
} 