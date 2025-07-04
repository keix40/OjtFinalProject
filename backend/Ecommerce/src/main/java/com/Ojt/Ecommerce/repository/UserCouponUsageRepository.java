package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.UserCouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserCouponUsageRepository extends JpaRepository<UserCouponUsage, Long> {
    boolean existsByUserIdAndDiscountId(Long userId, Long discountId);

    @Query("select count(cu) > 0 from UserCouponUsage cu where cu.user.id = :userId and cu.discount.id = :disId")
    boolean checkDiscountUsed(@Param("userId") Long userId, @Param("disId") Long disId);
}
