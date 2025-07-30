package com.Ojt.Ecommerce.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.Ojt.Ecommerce.entity.Events;

public interface EventRepository extends JpaRepository<Events, Long> {
    Optional<Events> findByNameIgnoreCaseAndStatus(String name, Integer status);

    @Query("SELECT MAX(e.slideNo) FROM Events e WHERE e.status = 1 OR e.status IS NULL")
    Integer findMaxActiveSlideNo();

    Optional<Events> findByIsDefaultAndStatus(Integer isDefault, Integer status);
}