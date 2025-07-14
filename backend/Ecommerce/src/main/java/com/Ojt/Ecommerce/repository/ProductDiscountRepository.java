package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.ProductDiscount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductDiscountRepository extends JpaRepository<ProductDiscount, Long> {
        void deleteAllByDiscountId(Long discountId);
}
