package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.AttributeValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AttributeValueRepository extends JpaRepository<AttributeValue, Long> {
    boolean existsByValueAndAttributeId(String value, Long attributeId);

    //    public List<AttributeValue> findByAttributeId(Long id);
    List<AttributeValue> findByAttribute_Id(Long attributeId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE AttributeValue av SET av.status = 0 WHERE av.id = :id")
    void softDeleteById(@Param("id") Long id);

    @Modifying
    @Query("UPDATE AttributeValue av SET av.value = :value WHERE av.id = :id")
    void updateValueById(@Param("id") Long id, @Param("value") String value);

    @Query("SELECT av FROM AttributeValue av WHERE av.attribute.id = :attributeId AND av.status = 1")
    List<AttributeValue> findActiveByAttribute_Id(@Param("attributeId") Long attributeId);
}
