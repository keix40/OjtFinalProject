package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.LoginAttemptDTO;
import com.Ojt.Ecommerce.dto.PagedResponse;
import com.Ojt.Ecommerce.service.LoginAttemptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/login-attempts")
@CrossOrigin
public class LoginAttemptController {

    @Autowired
    private LoginAttemptService loginAttemptService;

    // ✅ Get all login attempts
    @GetMapping
    public ResponseEntity<List<LoginAttemptDTO>> getAllAttempts() {
        return ResponseEntity.ok(loginAttemptService.getAllAttempts());
    }

    // ✅ Filter by status (e.g., failed, successful)
    @GetMapping("/status/{status}")
    public ResponseEntity<List<LoginAttemptDTO>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(loginAttemptService.getByStatus(status));
    }

    // ✅ Filter by threat level (e.g., critical, medium)
    @GetMapping("/threat/{level}")
    public ResponseEntity<List<LoginAttemptDTO>> getByThreatLevel(@PathVariable String level) {
        return ResponseEntity.ok(loginAttemptService.getByThreatLevel(level));
    }

    // ✅ Search by username/IP/location
    @GetMapping("/search")
    public ResponseEntity<List<LoginAttemptDTO>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(loginAttemptService.search(keyword));
    }

    // ✅ Filter by time range
    @GetMapping("/range")
    public ResponseEntity<List<LoginAttemptDTO>> getByTimeRange(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end
    ) {
        return ResponseEntity.ok(loginAttemptService.getByTimeRange(start, end));
    }

    // ✅ Save a new login attempt
    @PostMapping
    public ResponseEntity<Void> save(@RequestBody LoginAttemptDTO dto) {
        loginAttemptService.saveAttempt(dto);
        return ResponseEntity.ok().build();
    }

    // 🛡️ (Optional future) Block/whitelist IP – will implement in Step 10
    @GetMapping("/filter")
    public ResponseEntity<List<LoginAttemptDTO>> filterAndSearch(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String threatLevel,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        List<LoginAttemptDTO> results = loginAttemptService.filterAndSearch(
                status, threatLevel, searchTerm, startDate, endDate, sortBy, direction
        );
        return ResponseEntity.ok(results);
    }

    @GetMapping("/paged")
    public ResponseEntity<PagedResponse<LoginAttemptDTO>> getPagedAttempts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String threatLevel,
            @RequestParam(required = false) String searchTerm
    ) {
        return ResponseEntity.ok(loginAttemptService.getPagedAttempts(
                page, size, sortBy, direction, status, threatLevel, searchTerm
        ));
    }

    @PostMapping("/block-ip")
    public ResponseEntity<?> blockIP(@RequestParam String ip) {
        loginAttemptService.blockIP(ip);
        return ResponseEntity.ok("IP blocked");
    }

    @PostMapping("/whitelist-ip")
    public ResponseEntity<?> whitelistIP(@RequestParam String ip) {
        loginAttemptService.whitelistIP(ip);
        return ResponseEntity.ok("IP whitelisted");
    }

    @PostMapping("/block-ip/bulk")
    public ResponseEntity<?> bulkBlock(@RequestBody List<String> ipList) {
        loginAttemptService.blockIPs(ipList);
        return ResponseEntity.ok("IPs blocked");
    }


}
