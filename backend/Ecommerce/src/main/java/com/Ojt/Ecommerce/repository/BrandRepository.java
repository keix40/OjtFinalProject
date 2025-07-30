package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Brand;
import com.Ojt.Ecommerce.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    boolean existsByName(String name);

    @Query("select bc.brand from BrandHasCategory bc where bc.category.id = :id")
    public List<Brand> findAllBrandByCateId(@Param("id") Long id);

    @Query("select b from Brand b where b.status = 1")
    public List<Brand> findAllBrand();

}
