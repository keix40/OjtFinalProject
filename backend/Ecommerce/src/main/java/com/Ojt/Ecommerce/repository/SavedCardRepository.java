package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.SavedCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedCardRepository extends JpaRepository<SavedCard, Long> {
    List<SavedCard> findByUserId(Long userId);

    Optional<SavedCard> findByUserIdAndCardNumberAndExpiryDateAndCardBrandIgnoreCase(
            Long userId, String cardNumber, String expiryDate, String cardBrand);
}