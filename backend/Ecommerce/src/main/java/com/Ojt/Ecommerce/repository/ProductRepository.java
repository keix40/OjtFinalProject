package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByProductCode(String productCode);

}
