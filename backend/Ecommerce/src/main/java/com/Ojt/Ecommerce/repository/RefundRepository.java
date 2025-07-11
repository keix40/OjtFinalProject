package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefundRepository extends JpaRepository<Refund, Long> {
    Optional<Refund> findByReturnRequestId(Long returnRequestId);
}
