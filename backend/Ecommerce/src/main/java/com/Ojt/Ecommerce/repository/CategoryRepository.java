package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.sql.ClientInfoStatus;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    public boolean existsByName(String name);

    public Category findByName(String name);

}
