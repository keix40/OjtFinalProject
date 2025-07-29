package com.Ojt.Ecommerce.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Ojt.Ecommerce.entity.EventProduct;
import com.Ojt.Ecommerce.entity.Events;
import com.Ojt.Ecommerce.entity.Product;

public interface EventProductRepository extends JpaRepository<EventProduct, Long> {
    void deleteByEvents(Events events);
    List<EventProduct> findByProduct(Product product);
}
