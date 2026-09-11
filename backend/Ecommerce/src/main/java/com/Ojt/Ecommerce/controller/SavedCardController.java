package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.SavedCardRequestDTO;
import com.Ojt.Ecommerce.dto.SavedCardResponseDTO;
import com.Ojt.Ecommerce.service.SavedCardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.Ojt.Ecommerce.annotations.LogActivity;

import java.util.List;

@RestController
@RequestMapping("/card")
public class SavedCardController {

    private final SavedCardService cardService;

    public SavedCardController(SavedCardService cardService) {
        this.cardService = cardService;
    }

    @LogActivity(actionType = "CREATE", entityType = "SAVED_CARD", description = "Created saved card", severityLevel = "MEDIUM")
    @PostMapping
    public ResponseEntity<?> saveCard(@RequestBody SavedCardRequestDTO dto) {
        try {
            SavedCardResponseDTO saved = cardService.saveIfNewCard(dto);
            if (saved == null) {
                return ResponseEntity.ok("Card already saved.");
            }
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to save card: " + e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserCards(@PathVariable Long userId) {
        try {
            List<SavedCardResponseDTO> cards = cardService.getCardsByUserId(userId);
            return ResponseEntity.ok(cards);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Failed to fetch cards: " + e.getMessage());
        }
    }

    @LogActivity(actionType = "DELETE", entityType = "SAVED_CARD", description = "Deleted saved card", severityLevel = "HIGH", entityIdParam = "cardId")
    @PutMapping("/delete/{cardId}")
    public ResponseEntity<?> softDeleteCard(@PathVariable Long cardId) {
        try {
            cardService.softDeleteCard(cardId);
            return ResponseEntity.ok("Card soft-deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Failed to delete card: " + e.getMessage());
        }
    }

    @LogActivity(actionType = "UPDATE", entityType = "SAVED_CARD", description = "Updated saved card", severityLevel = "MEDIUM", entityIdParam = "cardId", logChanges = true)
    @PutMapping("/update/{cardId}")
    public ResponseEntity<?> updateCard(
            @PathVariable Long cardId,
            @RequestBody SavedCardRequestDTO dto
    ) {
        try {
            SavedCardResponseDTO updatedCard = cardService.updateCard(cardId, dto);
            return ResponseEntity.ok(updatedCard);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Failed to update card: " + e.getMessage());
        }
    }
}
