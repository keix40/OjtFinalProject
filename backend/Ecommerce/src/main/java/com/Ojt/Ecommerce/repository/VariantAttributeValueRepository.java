package com.Ojt.Ecommerce.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Ojt.Ecommerce.entity.ProductVariant;
import com.Ojt.Ecommerce.entity.VariantAttributeValue;

import java.util.List;

import java.util.List;

public interface VariantAttributeValueRepository extends JpaRepository<VariantAttributeValue, Integer> {
    void deleteByProductVariant(ProductVariant variant);
    List<VariantAttributeValue> findByProductVariant(ProductVariant variant);
}
