package com.Ojt.Ecommerce.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.entity.ProductDiscount;

@Repository
public interface ProductDiscountRepository extends JpaRepository<ProductDiscount, Long> {
        void deleteAllByDiscountId(Long discountId);
        List<ProductDiscount> findByProduct(Product product);
}
