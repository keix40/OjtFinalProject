package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.SavedCardRequestDTO;
import com.Ojt.Ecommerce.dto.SavedCardResponseDTO;
import com.Ojt.Ecommerce.entity.SavedCard;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.repository.SavedCardRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SavedCardService {

    private static final Logger logger = LoggerFactory.getLogger(SavedCardService.class);

    private final SavedCardRepository cardRepository;
    private final UserRepository userRepository;

    public SavedCardService(SavedCardRepository cardRepository, UserRepository userRepository) {
        this.cardRepository = cardRepository;
        this.userRepository = userRepository;
    }

    public SavedCard saveIfNewCard(SavedCardRequestDTO dto) {
        try {
            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            boolean exists = cardRepository
                    .findByUserIdAndCardNumberAndExpiryDateAndCardBrandIgnoreCase(
                            dto.getUserId(), dto.getCardNumber(), dto.getExpiryDate(), dto.getCardBrand())
                    .isPresent();

            if (!exists) {
                SavedCard card = new SavedCard();
                card.setUser(user);
                card.setCardholderName(dto.getCardholderName());
                card.setCardNumber(dto.getCardNumber());
                card.setExpiryDate(dto.getExpiryDate());
                card.setCardBrand(dto.getCardBrand());
                card.setDefault(dto.isDefault());
                return cardRepository.save(card);
            } else {
                logger.info("Card already exists for userId={}", dto.getUserId());
                return null;
            }
        } catch (Exception e) {
            logger.error("Error saving card", e);
            throw e;
        }
    }

    public List<SavedCardResponseDTO> getCardsByUserId(Long userId) {
        List<SavedCard> cards = cardRepository.findByUserId(userId);
        return cards.stream()
                .map(card -> new SavedCardResponseDTO(
                        card.getId(),
                        card.getCardholderName(),
                        card.getCardBrand(),
                        card.getExpiryDate(),
                        card.isDefault(),
                        maskCardNumber(card.getCardNumber())
                ))
                .collect(Collectors.toList());
    }

    public void deleteCard(Long id) {
        cardRepository.deleteById(id);
    }

    // Mask card number except last 4 digits for security
    private String maskCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) return cardNumber;
        int len = cardNumber.length();
        String masked = "*".repeat(len - 4) + cardNumber.substring(len - 4);
        return masked.replaceAll(".{4}(?=.)", "$0 "); // Add spaces every 4 chars
    }
}
