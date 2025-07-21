package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.entity.RevenueTarget;
import com.Ojt.Ecommerce.service.RevenueTargetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/target")
@CrossOrigin(origins = "http://localhost:4200")
public class RevenueTargetController {
    @Autowired
    private RevenueTargetService revenueTargetService;

    @GetMapping
    public ResponseEntity<?> getTarget(@RequestParam String periodType, @RequestParam String periodValue) {
        Optional<RevenueTarget> target = revenueTargetService.getTarget(periodType, periodValue);
        if (target.isPresent()) {
            return ResponseEntity.ok(target.get());
        } else {
            return ResponseEntity.ok(Map.of("targetAmount", 0));
        }
    }

    @PostMapping
    public ResponseEntity<?> setTarget(@RequestBody Map<String, Object> payload) {
        String periodType = (String) payload.get("periodType");
        String periodValue = (String) payload.get("periodValue");
        Double targetAmount = Double.valueOf(payload.get("targetAmount").toString());
        RevenueTarget target = revenueTargetService.setTarget(periodType, periodValue, targetAmount);
        return ResponseEntity.ok(target);
    }
} 