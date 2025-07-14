package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Brand;
import com.Ojt.Ecommerce.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.sql.ClientInfoStatus;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    public boolean existsByName(String name);

    public Category findByName(String name);

    @Query("select c from Category c where c.status = 1")
    public List<Category> findAllCategory();

    List<Category> findByParentIsNullAndStatus(int status);

    @Query("SELECT COUNT(c) > 0 FROM Category c WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(:name)) AND c.parent.id = :parentId")
    boolean existsByNameAndParent(@Param("name") String name, @Param("parentId") Long parentId);

}
