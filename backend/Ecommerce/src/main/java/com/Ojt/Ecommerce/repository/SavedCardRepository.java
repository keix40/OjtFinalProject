package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.SavedCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SavedCardRepository extends JpaRepository<SavedCard, Long> {
    @Query("select sc from SavedCard sc where sc.user.id = :userId and status = 1")
    List<SavedCard> findByUserId(@Param("userId") Long userId);

    Optional<SavedCard> findByUserIdAndCardNumberAndExpiryDateAndCardBrandIgnoreCase(
            Long userId, String cardNumber, String expiryDate, String cardBrand);
}