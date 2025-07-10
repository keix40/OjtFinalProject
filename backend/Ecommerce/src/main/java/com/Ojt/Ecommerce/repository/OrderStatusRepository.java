package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderStatusRepository extends JpaRepository<OrderStatus, Long> {
}
