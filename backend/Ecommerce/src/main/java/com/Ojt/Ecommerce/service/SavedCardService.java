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
        List<SavedCard> cards = cardRepository.findByUserId(userId)
                .stream()
                .filter(card -> card.getStatus() != null && card.getStatus() == 1)
                .collect(Collectors.toList());

        return cards.stream()
                .map(card -> new SavedCardResponseDTO(
                        card.getId(),
                        card.getCardholderName(),
                        card.getCardBrand(),
                        card.getExpiryDate(),
                        card.isDefault(),
                        card.getCardNumber()
                ))
                .collect(Collectors.toList());
    }

    public void softDeleteCard(Long cardId) {
        SavedCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));
        card.setStatus(0);
        cardRepository.save(card);
    }

    public SavedCardResponseDTO updateCard(Long cardId, SavedCardRequestDTO dto) {
        SavedCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));

        card.setCardholderName(dto.getCardholderName());
        card.setCardNumber(dto.getCardNumber());
        card.setExpiryDate(dto.getExpiryDate());
        card.setCardBrand(dto.getCardBrand());
        card.setDefault(dto.isDefault());

        SavedCard updated = cardRepository.save(card);

        return new SavedCardResponseDTO(
                updated.getId(),
                updated.getCardholderName(),
                updated.getCardBrand(),
                updated.getExpiryDate(),
                updated.isDefault(),
                updated.getCardNumber()
        );
    }

}
