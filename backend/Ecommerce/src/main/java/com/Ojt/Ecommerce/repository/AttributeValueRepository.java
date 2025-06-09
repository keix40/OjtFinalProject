package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.AttributeValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttributeValueRepository extends JpaRepository<AttributeValue, Long> {
    boolean existsByValueAndAttributeId(String value, Long attributeId);

    public List<AttributeValue> findByAttributeId(Long id);
}
