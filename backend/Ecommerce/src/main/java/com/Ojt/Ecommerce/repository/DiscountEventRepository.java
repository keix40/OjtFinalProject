package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.DiscountEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DiscountEventRepository extends JpaRepository<DiscountEvent, Long> {
}
