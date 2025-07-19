package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.VipTier;
import com.Ojt.Ecommerce.repository.VipTierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VipTierServiceImpl implements VipTierService {
    private final VipTierRepository vipTierRepository;

    @Override
    public List<VipTier> getAllTiers() {
        return vipTierRepository.findAll();
    }

    @Override
    public VipTier getTierById(Long id) {
        return vipTierRepository.findById(id).orElse(null);
    }

    @Override
    public VipTier createTier(VipTier tier) {
        return vipTierRepository.save(tier);
    }

    @Override
    public VipTier updateTier(Long id, VipTier tier) {
        tier.setId(id);
        return vipTierRepository.save(tier);
    }

    @Override
    public void deleteTier(Long id) {
        vipTierRepository.deleteById(id);
    }
} 