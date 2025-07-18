package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.entity.UserActivity;
import com.Ojt.Ecommerce.repository.UserActivityRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.repository.RoleRepository;
import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.dto.UserDTO;
import com.Ojt.Ecommerce.dto.PermissionDTO;
import com.Ojt.Ecommerce.service.UserActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@RestController
@RequestMapping("/api/admin-users")
@CrossOrigin(origins = "http://localhost:4200")
public class AdminUserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserActivityRepository userActivityRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserActivityService userActivityService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Get all admin users (excluding customers, case-insensitive)
    @GetMapping
    public List<UserDTO> getAdminUsers() {
        return userRepository.findByRoleNameNotIgnoreCase("customer")
                .stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());
    }

    // Get activities for a specific admin user
    @GetMapping("/{id}/activities")
    public List<UserActivity> getAdminActivities(@PathVariable Long id) {
        return userActivityRepository.findAll()
            .stream()
            .filter(a -> a.getUserId().equals(id))
            .collect(Collectors.toList());
    }

    // Create admin user
    @PostMapping
    public ResponseEntity<?> createAdminUser(@RequestBody UserDTO dto) {
        if ("customer".equalsIgnoreCase(dto.getRoleName())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cannot create customer via this endpoint");
        }
        var roleOpt = roleRepository.findByName(dto.getRoleName());
        if (roleOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Role not found");
        }
        var user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword()); // Hash in real app!
        user.setStatus(com.Ojt.Ecommerce.entity.UserStatus.valueOf(dto.getStatus() != null ? dto.getStatus().toUpperCase() : "ACTIVE"));
        userRepository.save(user);
        return ResponseEntity.ok(new UserDTO(user));
    }

    // Edit admin user
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAdminUser(@PathVariable Long id, @RequestBody UserDTO dto) {
        var userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
        var user = userOpt.get();
        if (user.getRole().getName().equalsIgnoreCase("customer")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cannot edit customer via this endpoint");
        }
        if (dto.getName() != null) user.setName(dto.getName());
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());
        if (dto.getPassword() != null) user.setPassword(dto.getPassword()); // Hash in real app!
        if (dto.getPhoneNumber() != null) user.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getRoleName() != null && !dto.getRoleName().equalsIgnoreCase("customer")) {
            var roleOpt = roleRepository.findByName(dto.getRoleName());
            roleOpt.ifPresent(user::setRole);
        }
        if (dto.getStatus() != null) user.setStatus(com.Ojt.Ecommerce.entity.UserStatus.valueOf(dto.getStatus().toUpperCase()));
        userRepository.save(user);
        return ResponseEntity.ok(new UserDTO(user));
    }

    // Update admin status
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateAdminStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        var userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
        var user = userOpt.get();
        if (user.getRole().getName().equalsIgnoreCase("customer")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cannot update customer via this endpoint");
        }
        String status = body.get("status");
        user.setStatus(com.Ojt.Ecommerce.entity.UserStatus.valueOf(status.toUpperCase()));
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    // Delete admin user
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAdminUser(@PathVariable Long id) {
        var userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
        var user = userOpt.get();
        if (user.getRole().getName().equalsIgnoreCase("customer")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cannot delete customer via this endpoint");
        }
        userRepository.delete(user);
        return ResponseEntity.ok().build();
    }

    // Update admin permissions (placeholder, assumes permissions are managed via roles)
    @PutMapping("/{id}/permissions")
    public ResponseEntity<?> updateAdminPermissions(@PathVariable Long id, @RequestBody List<PermissionDTO> permissions) {
        // In a real app, you would update the user's role or assign direct permissions
        // For now, just return not implemented
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body("Direct user permissions not implemented. Use roles.");
    }

    // Add endpoint to get online status for all admin users
    @GetMapping("/online-status")
    public Map<Long, Map<String, Object>> getAdminUsersOnlineStatus() {
        // Get all admin users (not just ACTIVE)
        List<User> admins = userRepository.findByRoleNameNotIgnoreCase("customer");
        Map<Long, Map<String, Object>> result = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        for (User admin : admins) {
            Long adminId = admin.getId();
            UserActivity lastActivity = userActivityRepository.findTopByUserIdOrderByActivityTimeDesc(adminId);
            LocalDateTime lastActive = lastActivity != null ? lastActivity.getActivityTime() : null;
            boolean isOnline = admin.getStatus() != null && admin.getStatus().name().equals("ACTIVE") && lastActive != null && lastActive.isAfter(now.minusMinutes(5));
            Map<String, Object> status = new HashMap<>();
            status.put("lastActive", lastActive);
            status.put("isOnline", isOnline);
            result.put(adminId, status);
        }
        return result;
    }

    // Log admin activity endpoint
    @PostMapping("/activity")
    public ResponseEntity<?> logAdminActivity(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        String type = payload.get("type").toString();
        userActivityService.logActivity(userId, type);
        // Broadcast updated online status to all subscribers
        Map<Long, Map<String, Object>> status = getAdminUsersOnlineStatus();
        messagingTemplate.convertAndSend("/topic/admin-online-status", status);
        return ResponseEntity.ok().build();
    }
} 