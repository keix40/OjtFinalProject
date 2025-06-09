package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Attribute;
import com.Ojt.Ecommerce.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AttributeRepository extends JpaRepository<Attribute,Long> {

    boolean existsByName(String name);

    Optional<Attribute> findById(Long id);

}
