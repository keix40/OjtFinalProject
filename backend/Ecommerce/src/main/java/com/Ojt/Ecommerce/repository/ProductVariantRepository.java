package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Integer> {
}
