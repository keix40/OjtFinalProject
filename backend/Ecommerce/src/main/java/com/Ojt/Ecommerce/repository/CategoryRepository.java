package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.sql.ClientInfoStatus;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    public boolean existsByName(String name);

    public Category findByName(String name);

    @Query("select bc.category from BrandHasCategory bc where bc.brand.id = :id")
    public List<Category> findAllCategoryByBrandId(@Param("id") Long id);

}
