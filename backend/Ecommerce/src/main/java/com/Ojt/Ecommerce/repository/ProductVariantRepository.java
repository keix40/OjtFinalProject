package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Integer> {
    @Query("select pv.stock from ProductVariant pv where pv.id = :variantId")
    Integer findProductVariant(@Param("variantId") Long variantId);
}
