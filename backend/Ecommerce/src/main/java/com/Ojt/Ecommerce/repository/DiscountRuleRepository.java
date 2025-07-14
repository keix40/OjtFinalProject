package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Discount;
import com.Ojt.Ecommerce.entity.DiscountRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DiscountRuleRepository extends JpaRepository <DiscountRule, Long> {
    boolean existsByBrandIdAndDiscount_DiscountEvent_StatusTrue(Long brandId);

    boolean existsByCategoryIdAndDiscount_DiscountEvent_StatusTrue(Long categoryId);

    // New methods for duplicate checking
    @Query("SELECT dr FROM DiscountRule dr WHERE dr.brand.id = :brandId AND dr.discount.status = true")
    List<DiscountRule> findByBrandIdAndDiscountStatusTrue(@Param("brandId") Long brandId);

    @Query("SELECT dr FROM DiscountRule dr WHERE dr.category.id = :categoryId AND dr.discount.status = true")
    List<DiscountRule> findByCategoryIdAndDiscountStatusTrue(@Param("categoryId") Long categoryId);

    @Query("SELECT dr FROM DiscountRule dr WHERE dr.product.id = :productId AND dr.discount.status = true")
    List<DiscountRule> findByProductIdAndDiscountStatusTrue(@Param("productId") Long productId);

    @Query("SELECT dr FROM DiscountRule dr WHERE dr.brand.id = :brandId AND dr.category.id = :categoryId AND dr.discount.status = true")
    List<DiscountRule> findByBrandIdAndCategoryIdAndDiscountStatusTrue(@Param("brandId") Long brandId, @Param("categoryId") Long categoryId);

    // Method to get discount rules by discount ID
    List<DiscountRule> findByDiscount_Id(Long discountId);

    @Query("SELECT dr FROM DiscountRule dr WHERE dr.user.id = :userId AND dr.discount.status = true AND dr.targetType = 'USER'")
    List<DiscountRule> findActiveUserDiscounts(@Param("userId") Long userId);

    void deleteAllByDiscount(Discount discount);

}
