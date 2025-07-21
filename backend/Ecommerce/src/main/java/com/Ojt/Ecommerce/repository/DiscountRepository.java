package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Discount;
import com.Ojt.Ecommerce.entity.DiscountEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DiscountRepository extends JpaRepository<Discount, Long> {
    List<Discount> findByDiscountEventIsNull();
    List<Discount> findByDiscountEvent(DiscountEvent discountEvent);
    List<Discount> findByStatusTrue();
    Optional<Discount> findByName(String name);
    Optional<Discount> findByCode(String code);
    boolean existsByCode(String code);
}
