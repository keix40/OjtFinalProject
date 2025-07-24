package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.entity.VipTier;
import com.Ojt.Ecommerce.service.VipTierService;
import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;
import com.Ojt.Ecommerce.constants.PermissionConstants;
import com.Ojt.Ecommerce.annotations.RequiresPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vip-tiers")
@RequiredArgsConstructor
@PermissionCategoryTag(value = "vip_tiers",name = "VIP Tiers",icon = "fa-user-tag")
public class VipTierController {
    private final VipTierService vipTierService;

    @RequiresPermission(value = PermissionConstants.VIP_TIERS_VIEW,description = "View all VIP tiers")
    @GetMapping
    public List<VipTier> getAllTiers() {
        return vipTierService.getAllTiers();
    }

    @GetMapping("/{id}")
    public VipTier getTierById(@PathVariable Long id) {
        return vipTierService.getTierById(id);
    }

    @RequiresPermission(value = PermissionConstants.VIP_TIERS_CREATE,description = "Create a new VIP tier")
    @PostMapping
    public VipTier createTier(@RequestBody VipTier tier) {
        return vipTierService.createTier(tier);
    }

    @RequiresPermission(value = PermissionConstants.VIP_TIERS_UPDATE,description = "Update a VIP tier")
    @PutMapping("/{id}")
    public VipTier updateTier(@PathVariable Long id, @RequestBody VipTier tier) {
        return vipTierService.updateTier(id, tier);
    }

    @RequiresPermission(value = PermissionConstants.VIP_TIERS_DELETE,description = "Delete a VIP tier")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTier(@PathVariable Long id) {
        vipTierService.deleteTier(id);
        return ResponseEntity.ok().build();
    }
} 