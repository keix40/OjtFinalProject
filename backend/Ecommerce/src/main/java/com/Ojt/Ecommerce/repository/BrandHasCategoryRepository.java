package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.BrandHasCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BrandHasCategoryRepository extends JpaRepository<BrandHasCategory, Long> {

    @Modifying
    @Query("DELETE FROM BrandHasCategory b WHERE b.brand.id = :brandId")
    void deleteByBrandId(@Param("brandId") Long brandId);
}
