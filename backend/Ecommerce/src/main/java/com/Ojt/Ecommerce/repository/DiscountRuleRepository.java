package com.Ojt.Ecommerce.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.Ojt.Ecommerce.entity.Discount;
import com.Ojt.Ecommerce.entity.DiscountRule;

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

    List<DiscountRule> findByUserIdAndBrandIdAndDiscountStatusTrue(Long userId, Long brandId);
    List<DiscountRule> findByUserIdAndCategoryIdAndDiscountStatusTrue(Long userId, Long categoryId);
    List<DiscountRule> findByUserIdAndBrandIdAndCategoryIdAndDiscountStatusTrue(Long userId, Long brandId, Long categoryId);
    List<DiscountRule> findByUserIdAndProductIdAndDiscountStatusTrue(Long userId, Long productId);
    void deleteByUserIdAndProductId(Long userId, Long productId);
    void deleteByUserIdAndBrandId(Long userId, Long brandId);
    void deleteByUserIdAndCategoryId(Long userId, Long categoryId);
    void deleteByUserIdAndBrandIdAndCategoryId(Long userId, Long brandId, Long categoryId);
    @Query("SELECT dr FROM DiscountRule dr WHERE dr.product.id = :productId AND (dr.user.id = :userId OR dr.user IS NULL) AND dr.discount.status = true ORDER BY dr.user.id DESC")
    DiscountRule findActiveProductDiscountRule(@Param("productId") Long productId, @Param("userId") Long userId);

}
