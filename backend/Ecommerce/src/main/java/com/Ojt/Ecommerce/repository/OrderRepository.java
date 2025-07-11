package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.UserOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<UserOrder, Long> {
    boolean existsByOrderCode(String orderCode);

    List<UserOrder> findByUserId(Long userId);

    @EntityGraph(attributePaths = {
            "orderProducts",
            "orderStatusHistory"
    })
    @Query("SELECT o FROM UserOrder o WHERE o.id = :id")
    UserOrder findByIdWithEntity(@Param("id") Long id);
}
