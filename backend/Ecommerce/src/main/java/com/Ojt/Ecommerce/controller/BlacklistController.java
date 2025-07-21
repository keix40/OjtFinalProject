package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.entity.BlacklistEntry;
import com.Ojt.Ecommerce.service.BlacklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blacklist")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class BlacklistController {
    private final BlacklistService blacklistService;

    @GetMapping("/entries")
    public ResponseEntity<?> getEntries(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        try {
            // Validate page and pageSize
            if (page < 0) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Page number cannot be negative"));
            }
            if (pageSize <= 0) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Page size must be positive"));
            }

            Page<BlacklistEntry> entriesPage = blacklistService.getEntries(
                search, category, status, riskLevel, PageRequest.of(page, pageSize));
            
            Map<String, Object> response = Map.of(
                "entries", entriesPage.getContent(),
                "total", entriesPage.getTotalElements(),
                "totalPages", entriesPage.getTotalPages(),
                "currentPage", entriesPage.getNumber()
            );
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Invalid parameter: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "message", "Something went wrong: " + e.getMessage(),
                    "status", 500,
                    "timestamp", LocalDateTime.now().toString()
                ));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(blacklistService.getStats());
    }

    @PostMapping("/entries")
    public ResponseEntity<BlacklistEntry> addEntry(@RequestBody BlacklistEntry entry) {
        return ResponseEntity.ok(blacklistService.addEntry(entry));
    }

    @GetMapping("/entries/{id}")
    public ResponseEntity<BlacklistEntry> getEntry(@PathVariable String id) {
        return ResponseEntity.ok(blacklistService.getEntry(id));
    }

    @PutMapping("/entries/{id}")
    public ResponseEntity<BlacklistEntry> updateEntry(
            @PathVariable String id,
            @RequestBody BlacklistEntry entry) {
        return ResponseEntity.ok(blacklistService.updateEntry(id, entry));
    }

    @DeleteMapping("/entries/{id}")
    public ResponseEntity<Void> deleteEntry(@PathVariable String id) {
        blacklistService.deleteEntry(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/entries/{id}/lift")
    public ResponseEntity<BlacklistEntry> liftBan(@PathVariable String id) {
        return ResponseEntity.ok(blacklistService.liftBan(id));
    }

    @PostMapping("/entries/bulk-lift")
    public ResponseEntity<Void> bulkLiftBan(@RequestBody Map<String, List<String>> request) {
        blacklistService.bulkLiftBan(request.get("ids"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/entries/{id}/notes")
    public ResponseEntity<BlacklistEntry> addNote(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(blacklistService.addNote(id, request.get("note")));
    }

    @PostMapping("/entries/{id}/extend")
    public ResponseEntity<BlacklistEntry> extendBan(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        LocalDateTime newExpiryDate = LocalDateTime.parse(request.get("expiryDate"));
        return ResponseEntity.ok(blacklistService.extendBan(id, newExpiryDate));
    }

    @PostMapping("/entries/bulk-extend")
    public ResponseEntity<Void> bulkExtendBan(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) request.get("ids");
        LocalDateTime newExpiryDate = LocalDateTime.parse((String) request.get("expiryDate"));
        blacklistService.bulkExtendBan(ids, newExpiryDate);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/entries/bulk-category")
    public ResponseEntity<Void> bulkUpdateCategory(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) request.get("ids");
        String category = (String) request.get("category");
        blacklistService.bulkUpdateCategory(ids, category);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportEntries(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String riskLevel) {
        
        byte[] content = blacklistService.exportEntries(search, category, status, riskLevel);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                       "attachment; filename=blacklist-entries.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(content);
    }

    @GetMapping("/entries/{id}/incidents")
    public ResponseEntity<List<Map<String, Object>>> getIncidentHistory(@PathVariable String id) {
        return ResponseEntity.ok(blacklistService.getIncidentHistory(id));
    }

    @GetMapping("/auto-rules")
    public ResponseEntity<Map<String, Boolean>> getAutoRules() {
        return ResponseEntity.ok(blacklistService.getAutoRules());
    }

    @PutMapping("/auto-rules")
    public ResponseEntity<Map<String, Boolean>> updateAutoRules(
            @RequestBody Map<String, Boolean> rules) {
        return ResponseEntity.ok(blacklistService.updateAutoRules(rules));
    }
} 