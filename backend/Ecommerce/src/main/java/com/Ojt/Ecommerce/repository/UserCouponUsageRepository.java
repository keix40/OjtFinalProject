package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.UserCouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserCouponUsageRepository extends JpaRepository<UserCouponUsage, Long> {
    boolean existsByUserIdAndDiscountId(Long userId, Long discountId);
}
