package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.DeliveryService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryServiceRepository extends JpaRepository<DeliveryService, Long> {
    List<DeliveryService> findByStatus(int status);
    Optional<DeliveryService> findByIdAndStatus(Long id, int status);
}