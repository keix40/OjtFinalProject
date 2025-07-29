package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.entity.Appeal;
import com.Ojt.Ecommerce.service.AppealService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appeals")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AppealController {

    private final AppealService appealService;

    // Submit new appeal - completely public endpoint for blacklisted users
    @PostMapping("/submit")
    public ResponseEntity<?> submitAppeal(@RequestBody Map<String, Object> appealData) {
        try {
            System.out.println("Appeal submission received: " + appealData);
            Appeal appeal = appealService.submitAppeal(appealData);
            System.out.println("Appeal saved with ID: " + appeal.getId());
            return ResponseEntity.ok(Map.of(
                "message", "Appeal submitted successfully",
                "appealId", appeal.getId(),
                "status", appeal.getStatus()
            ));
        } catch (Exception e) {
            System.err.println("Error submitting appeal: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to submit appeal: " + e.getMessage()
            ));
        }
    }

    // Get all appeals (admin only)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Appeal>> getAllAppeals() {
        List<Appeal> appeals = appealService.getAllAppeals();
        return ResponseEntity.ok(appeals);
    }

    // Get pending appeals (admin only)
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Appeal>> getPendingAppeals() {
        List<Appeal> appeals = appealService.getPendingAppeals();
        return ResponseEntity.ok(appeals);
    }

    // Get appeal by ID (admin only)
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Appeal> getAppealById(@PathVariable String id) {
        Appeal appeal = appealService.getAppealById(id);
        return ResponseEntity.ok(appeal);
    }

    // Review appeal (admin only)
    @PostMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> reviewAppeal(
            @PathVariable String id,
            @RequestBody Map<String, Object> reviewData) {
        try {
            Appeal appeal = appealService.reviewAppeal(id, reviewData);
            return ResponseEntity.ok(Map.of(
                "message", "Appeal reviewed successfully",
                "appealId", appeal.getId(),
                "status", appeal.getStatus()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to review appeal: " + e.getMessage()
            ));
        }
    }

    // Get appeal statistics (admin only)
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAppealStats() {
        Map<String, Object> stats = appealService.getAppealStats();
        return ResponseEntity.ok(stats);
    }
}