package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.SavedCardRequestDTO;
import com.Ojt.Ecommerce.dto.SavedCardResponseDTO;
import com.Ojt.Ecommerce.entity.SavedCard;
import com.Ojt.Ecommerce.service.SavedCardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/card")
public class SavedCardController {

    private final SavedCardService cardService;

    public SavedCardController(SavedCardService cardService) {
        this.cardService = cardService;
    }

    @PostMapping
    public ResponseEntity<?> saveCard(@RequestBody SavedCardRequestDTO dto) {
        SavedCard saved = cardService.saveIfNewCard(dto);
        if (saved == null) {
            return ResponseEntity.ok("Card already saved.");
        }

        SavedCardResponseDTO response = new SavedCardResponseDTO(
                saved.getId(),
                saved.getCardholderName(),
                saved.getCardBrand(),
                saved.getExpiryDate(),
                saved.isDefault(),
                maskCardNumber(saved.getCardNumber())
        );

        return ResponseEntity.ok(response);
    }

    private String maskCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) return cardNumber;
        String last4 = cardNumber.substring(cardNumber.length() - 4);
        return "**** **** **** " + last4;
    }


    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SavedCardResponseDTO>> getUserCards(@PathVariable Long userId) {
        List<SavedCardResponseDTO> cards = cardService.getCardsByUserId(userId);
        return ResponseEntity.ok(cards);
    }

    @DeleteMapping("/{cardId}")
    public ResponseEntity<?> deleteCard(@PathVariable Long cardId) {
        cardService.deleteCard(cardId);
        return ResponseEntity.ok().build();
    }
}
