package com.Ojt.Ecommerce.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.entity.ProductVariant;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Integer> {
    @Query("select pv.stock from ProductVariant pv where pv.id = :variantId")
    Integer findProductVariant(@Param("variantId") Long variantId);
    
    List<ProductVariant> findByProduct(Product product);
}
