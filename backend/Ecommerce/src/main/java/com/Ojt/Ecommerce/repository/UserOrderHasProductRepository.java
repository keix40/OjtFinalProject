package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.UserOrderHasProduct;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserOrderHasProductRepository extends JpaRepository<UserOrderHasProduct, Long> {
}
