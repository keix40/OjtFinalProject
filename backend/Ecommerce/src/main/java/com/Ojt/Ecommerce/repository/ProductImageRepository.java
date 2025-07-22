package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.ProductImage;
import com.Ojt.Ecommerce.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProductVariant(ProductVariant variant);
}
