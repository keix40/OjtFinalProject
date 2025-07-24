package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.VipTier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VipTierRepository extends JpaRepository<VipTier, Long> {
    Optional<VipTier> findTopByMinPointsLessThanEqualOrderByMinPointsDesc(Integer totalPoints);
} 