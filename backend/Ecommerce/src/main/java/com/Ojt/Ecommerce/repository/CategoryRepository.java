package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    public boolean existsByName(String name);

    Category findByName(String name);
}
