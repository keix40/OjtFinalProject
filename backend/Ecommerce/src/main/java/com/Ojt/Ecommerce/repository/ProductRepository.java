package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    public boolean existsByProductCode(String productCode);

    @Query("Select p from Product p where p.status <> 2")
    public List<Product> findAllProduct();

    @Query("Select p from Product p where p.quantity <> 0 and p.status <> 2")
    public List<Product> getAllActiveProduct();

    @Modifying
    @Query("Update Product p set p.status = 2 where p.id = :id")
    public void deleteProduct(@Param("id") Long id);

    @Modifying
    @Query("Update Product p set p.status = 0 where p.id = :id")
    public void inactiveProduct(@Param("id") Long id);

    @Modifying
    @Query("Update Product p set p.status = 1 where p.id = :id")
    public void activeProduct(@Param("id") Long id);
}
