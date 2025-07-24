package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Attribute;
import com.Ojt.Ecommerce.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AttributeRepository extends JpaRepository<Attribute,Long> {

    boolean existsByNameAndStatus(String name, int status);

    Optional<Attribute> findById(Long id);

    @Modifying
    @Query("UPDATE Attribute a SET a.status = 0 WHERE a.id = :id")
    void softDeleteById(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Attribute a SET a.name = :name WHERE a.id = :id")
    void updateNameById(@Param("id") Long id, @Param("name") String name);

    @Query("SELECT a FROM Attribute a WHERE a.status = 1")
    List<Attribute> findAllActive();
}
