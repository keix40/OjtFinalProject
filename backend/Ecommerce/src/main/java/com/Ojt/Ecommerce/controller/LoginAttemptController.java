package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.LoginAttemptDTO;
import com.Ojt.Ecommerce.dto.PagedResponse;
import com.Ojt.Ecommerce.service.LoginAttemptService;
import com.Ojt.Ecommerce.service.SecurityPolicyService;
import com.Ojt.Ecommerce.entity.SecurityPolicyRule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/login-attempts")
@CrossOrigin
public class LoginAttemptController {

    @Autowired
    private LoginAttemptService loginAttemptService;
    @Autowired
    private SecurityPolicyService securityPolicyService;

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
        System.out.println("Received block request for IP: " + ip);
        loginAttemptService.blockIP(ip);
        System.out.println("blockIP service called for: " + ip);
        return ResponseEntity.ok(java.util.Map.of("message", "IP blocked"));
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

    // ✅ Get all login attempts by sessionId
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<LoginAttemptDTO>> getBySessionId(@PathVariable String sessionId) {
        return ResponseEntity.ok(loginAttemptService.getBySessionId(sessionId));
    }

    // ✅ Block all attempts by sessionId
    @PostMapping("/block-session")
    public ResponseEntity<?> blockSession(@RequestParam String sessionId) {
        loginAttemptService.blockSession(sessionId);
        return ResponseEntity.ok("Session blocked");
    }

    // ✅ Whitelist all attempts by sessionId
    @PostMapping("/whitelist-session")
    public ResponseEntity<?> whitelistSession(@RequestParam String sessionId) {
        loginAttemptService.whitelistSession(sessionId);
        return ResponseEntity.ok("Session whitelisted");
    }

    @GetMapping("/is-blocked")
    public ResponseEntity<?> isBlocked(@RequestParam String ip) {
        try {
            boolean blocked = loginAttemptService.isIPBlocked(ip);
            LocalDateTime until = loginAttemptService.getBlockedUntil(ip);
            String untilStr = until != null ? until.toString() : "";
            Map<String, Object> result = new HashMap<>();
            result.put("blocked", blocked);
            result.put("blockedUntil", untilStr);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace(); // Log the full stack trace
            return ResponseEntity.status(500).body(Map.of(
                "message", "Something went wrong: " + e.getMessage()
            ));
        }
    }

    // Endpoint to get current security policy
    @GetMapping("/security-policy")
    public ResponseEntity<List<SecurityPolicyRule>> getSecurityPolicy() {
        securityPolicyService.seedDefaultsIfEmpty();
        return ResponseEntity.ok(securityPolicyService.getAllRules());
    }

    // Update a security policy rule
    @PutMapping("/security-policy/{id}")
    public ResponseEntity<SecurityPolicyRule> updateSecurityPolicyRule(@PathVariable Long id, @RequestBody SecurityPolicyRule updatedRule) {
        SecurityPolicyRule rule = securityPolicyService.updateRule(id, updatedRule);
        return ResponseEntity.ok(rule);
    }

    // Delete a security policy rule
    @DeleteMapping("/security-policy/{id}")
    public ResponseEntity<?> deleteSecurityPolicyRule(@PathVariable Long id) {
        securityPolicyService.deleteRule(id);
        return ResponseEntity.ok().build();
    }


}
