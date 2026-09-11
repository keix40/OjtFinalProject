package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.SavedCardRequestDTO;
import com.Ojt.Ecommerce.dto.SavedCardResponseDTO;
import com.Ojt.Ecommerce.entity.SavedCard;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.repository.SavedCardRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.security.SecurityUtils;
import com.Ojt.Ecommerce.util.CardMaskingUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
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

    public SavedCardResponseDTO saveIfNewCard(SavedCardRequestDTO dto) {
        SecurityUtils.enforceSelfOrAdmin(dto.getUserId());

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String lastFour = CardMaskingUtil.extractLastFour(dto.getCardNumber());

        boolean exists = cardRepository
                .findByUserIdAndLastFourAndExpiryDateAndCardBrandIgnoreCase(
                        dto.getUserId(), lastFour, dto.getExpiryDate(), dto.getCardBrand())
                .isPresent();

        if (exists) {
            logger.info("Card already exists for userId={}", dto.getUserId());
            return null;
        }

        SavedCard card = new SavedCard();
        card.setUser(user);
        card.setCardholderName(dto.getCardholderName());
        card.setLastFour(lastFour);
        card.setExpiryDate(dto.getExpiryDate());
        card.setCardBrand(dto.getCardBrand());
        card.setDefault(dto.isDefault());
        SavedCard saved = cardRepository.save(card);
        return convertToDTO(saved);
    }

    public List<SavedCardResponseDTO> getCardsByUserId(Long userId) {
        SecurityUtils.enforceSelfOrAdmin(userId);
        return cardRepository.findByUserId(userId).stream()
                .filter(card -> card.getStatus() != null && card.getStatus() == 1)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public void softDeleteCard(Long cardId) {
        SavedCard card = requireOwnedCard(cardId);
        card.setStatus(0);
        cardRepository.save(card);
    }

    public SavedCardResponseDTO updateCard(Long cardId, SavedCardRequestDTO dto) {
        SavedCard card = requireOwnedCard(cardId);
        card.setCardholderName(dto.getCardholderName());
        if (dto.getCardNumber() != null && !dto.getCardNumber().isBlank()) {
            card.setLastFour(CardMaskingUtil.extractLastFour(dto.getCardNumber()));
        }
        card.setExpiryDate(dto.getExpiryDate());
        card.setCardBrand(dto.getCardBrand());
        card.setDefault(dto.isDefault());
        return convertToDTO(cardRepository.save(card));
    }

    public SavedCard getCardById(Long cardId) {
        return requireOwnedCard(cardId);
    }

    public SavedCardResponseDTO convertToDTO(SavedCard card) {
        String lastFour = CardMaskingUtil.maskForDisplay(card.getLastFour());
        return new SavedCardResponseDTO(
                card.getId(),
                card.getCardholderName(),
                card.getCardBrand(),
                card.getExpiryDate(),
                card.isDefault(),
                lastFour,
                "**** **** **** " + lastFour
        );
    }

    private SavedCard requireOwnedCard(Long cardId) {
        SavedCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));
        if (card.getUser() == null) {
            throw new AccessDeniedException("Card has no owner");
        }
        SecurityUtils.enforceSelfOrAdmin(card.getUser().getId());
        return card;
    }
}
