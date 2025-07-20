package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.VipTier;
import java.util.List;

public interface VipTierService {
    List<VipTier> getAllTiers();
    VipTier getTierById(Long id);
    VipTier createTier(VipTier tier);
    VipTier updateTier(Long id, VipTier tier);
    void deleteTier(Long id);
} 