package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.entity.VipTier;
import com.Ojt.Ecommerce.service.VipTierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vip-tiers")
@RequiredArgsConstructor
public class VipTierController {
    private final VipTierService vipTierService;

    @GetMapping
    public List<VipTier> getAllTiers() {
        return vipTierService.getAllTiers();
    }

    @GetMapping("/{id}")
    public VipTier getTierById(@PathVariable Long id) {
        return vipTierService.getTierById(id);
    }

    @PostMapping
    public VipTier createTier(@RequestBody VipTier tier) {
        return vipTierService.createTier(tier);
    }

    @PutMapping("/{id}")
    public VipTier updateTier(@PathVariable Long id, @RequestBody VipTier tier) {
        return vipTierService.updateTier(id, tier);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTier(@PathVariable Long id) {
        vipTierService.deleteTier(id);
        return ResponseEntity.ok().build();
    }
} 