package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.UserOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<UserOrder, Long> {
    boolean existsByOrderCode(String orderCode);

    List<UserOrder> findByUserId(Long userId);
}
