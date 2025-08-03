package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;
import com.Ojt.Ecommerce.annotations.RequiresPermission;
import com.Ojt.Ecommerce.annotations.LogActivity;
import com.Ojt.Ecommerce.dto.RegisterRequest;
import com.Ojt.Ecommerce.dto.UserDTO;
import com.Ojt.Ecommerce.dto.AdminCreateUserRequest;
import com.Ojt.Ecommerce.dto.AddressDTO;
import com.Ojt.Ecommerce.dto.CustomerSummaryDTO;
import com.Ojt.Ecommerce.dto.SessionRequestDTO;
import com.Ojt.Ecommerce.entity.AddressType;
import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.entity.UserStatus;
import com.Ojt.Ecommerce.repository.RoleRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import com.Ojt.Ecommerce.service.AddressService;
import com.Ojt.Ecommerce.service.UserService;
import com.Ojt.Ecommerce.service.UserActivityService;
import com.Ojt.Ecommerce.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import static com.Ojt.Ecommerce.constants.PermissionConstants.*;


@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/auth/user")
@RequiredArgsConstructor  // Lombok annotation to generate constructor for final fields
@PermissionCategoryTag(value = "users", name = "User Management", icon = "fas fa-users") // add
public class UserController {

    private final UserService userService;  // Inject UserService
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;
    private final AddressService addressService;
    private final RoleRepository roleRepository;
    @Autowired
    private UserActivityService userActivityService;

    @Autowired
    private SessionService sessionService;

    @GetMapping("/hello")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<String> helloUser() {
        return ResponseEntity.ok("Hello, authenticated user!");
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> helloAdmin() {
        return ResponseEntity.ok("Hello, Admin!");
    }

//    @GetMapping("/all")
//    public ResponseEntity<List<User>> getAllUsers() {
//        List<User> users = userService.getAllUsers();  // Call service method to get users
//        return ResponseEntity.ok(users);
//    }

    //fix to error
    @GetMapping("/all")
    @RequiresPermission(value = USERS_VIEW, level = "basic", description = "View all users in the system")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers().stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/customers")
    @RequiresPermission(value = CUSTOMERS_VIEW, level = "basic", description = "View all customers")
    public List<CustomerSummaryDTO> getAllCustomers() {
        return userService.getAllCustomerSummaries();
    }

    @GetMapping("/vip-customers")
    @RequiresPermission(value = CUSTOMERS_VIEW_VIP, level = "intermediate", description = "View VIP customers")
    public List<CustomerSummaryDTO> getAllVipCustomers() {
        return userService.getAllVipCustomers();
    }


    //to show userProfile userinfo (kei_1)
    @LogActivity(actionType = "UPDATE", entityType = "USER", description = "Updated user", severityLevel = "MEDIUM", entityIdParam = "id", logChanges = true)
    @PutMapping("/{id}")
    @Transactional
    @RequiresPermission(value = USERS_UPDATE, level = "intermediate", description = "Update user information")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long id, @RequestBody RegisterRequest dto, @RequestHeader("Authorization") String token) {
        RegisterRequest updatedUser = userService.updateUser(id, dto);

        User user = userRepository.findById(id).orElseThrow();
        String newToken = jwtTokenProvider.generateToken(user);

        // Create response with both updated user and new token
        Map<String, Object> response = new HashMap<>();
        response.put("user", updatedUser);
        response.put("token", newToken);
        return ResponseEntity.ok(response);

    }

    @PutMapping("/{userId}/assign-role")
    @RequiresPermission(value = USERS_ASSIGN_ROLE, level = "advanced", description = "Assign roles to users")
    public ResponseEntity<String> assignRoleToUser(
            @PathVariable Long userId,
            @RequestParam Long roleId,
            @RequestHeader("Authorization") String tokenHeader
    ) {
        // Get current user from token to check if they're assigning role to themselves
        String token = tokenHeader.replace("Bearer ", "");
        String currentUserEmail = jwtTokenProvider.getEmailFromToken(token);
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found"));
        
        // Assign role to user
        userService.assignRoleToUser(userId, roleId);
        
        // If the current user is assigning role to themselves, return a new token
        if (currentUser.getId() == userId) {
            // Get the updated user with new role
            User updatedUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Updated user not found"));
            
            // Generate new token with updated role information
            String newToken = jwtTokenProvider.generateToken(updatedUser);
            
            // Return the new token in the response
            return ResponseEntity.ok("{\"message\":\"Role assigned successfully\",\"newToken\":\"" + newToken + "\",\"userAffected\":true}");
        }
        
        return ResponseEntity.ok("{\"message\":\"Role assigned successfully\",\"userAffected\":false}");
    }

    @GetMapping("/roles/{roleId}/users")
    @RequiresPermission(value = USERS_VIEW_BY_ROLE, level = "basic", description = "View users by role")
    public ResponseEntity<List<UserDTO>> getUsersByRole(@PathVariable Long roleId) {
        List<User> users = userService.findUsersByRoleId(roleId);

        List<UserDTO> userDTOs = users.stream()
                .map(user -> {
                    UserDTO dto = modelMapper.map(user, UserDTO.class);
                    if (user.getRole() != null) {
                        dto.setRoleId(user.getRole().getId());
                        dto.setRoleName(user.getRole().getName());
                    }
                    return dto;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(userDTOs);
    }

    @LogActivity(actionType = "CREATE", entityType = "USER", description = "Admin created user", severityLevel = "MEDIUM")
    @PostMapping("/createUser")
    @RequiresPermission(value = USERS_CREATE, level = "intermediate", description = "Create new user")
    public ResponseEntity<?> createUserByAdmin(@RequestBody AdminCreateUserRequest request) {
        // 1. Find role by name
        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new RuntimeException("Role not found: " + request.getRole()));

        // 2. Create User entity
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setGender(request.getGender());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(role);
        user.setVerified(request.getEmailVerified() != null ? request.getEmailVerified() : false); // Set from request
        user.setCreatedDate(java.time.LocalDateTime.now());
        user.setStatus(UserStatus.ACTIVE); // Explicitly set status to ACTIVE
        userRepository.save(user);

        // 3. Create Address if provided
        if (request.getAddress() != null && !request.getAddress().isEmpty()) {
            AddressDTO addressDTO = new AddressDTO();
            addressDTO.setAddress(request.getAddress());
            addressDTO.setCity(request.getCity());
            addressDTO.setState(request.getState());
            addressDTO.setPostalCode(request.getPostalCode());
            addressDTO.setCountry(request.getCountry());
            addressDTO.setUserId(user.getId());
            if (request.getAddressType() != null) {
                try {
                    addressDTO.setType(AddressType.valueOf(request.getAddressType().toUpperCase()));
                } catch (Exception e) {
                    addressDTO.setType(AddressType.HOME); // default
                }
            } else {
                addressDTO.setType(AddressType.HOME);
            }
            addressService.addNewAddress(addressDTO);
        }

        // 4. Return UserDTO (optionally include address info)
        UserDTO userDTO = new UserDTO(user);
        userDTO.setRoleId(role.getId());
        userDTO.setRoleName(role.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(userDTO);
    }

    @PostMapping("/bulk-create")
    @Transactional
    @RequiresPermission(value = USERS_CREATE, level = "intermediate", route = "/users/bulk-create")
    public ResponseEntity<?> bulkCreateUsers(@RequestBody List<AdminCreateUserRequest> requests) {
        List<Map<String, Object>> results = new java.util.ArrayList<>();
        for (AdminCreateUserRequest req : requests) {
            try {
                User user = userService.createUserByAdmin(req);
                results.add(Map.of("email", req.getEmail(), "success", true, "userId", user.getId()));
            } catch (Exception e) {
                results.add(Map.of("email", req.getEmail(), "success", false, "error", e.getMessage()));
            }
        }
        boolean allSuccess = results.stream().allMatch(r -> (boolean) r.get("success"));
        return ResponseEntity.status(allSuccess ? HttpStatus.CREATED : HttpStatus.MULTI_STATUS).body(results);
    }

    // --- Added for customer management actions ---
    // Delete user endpoint (for customer management table delete action)
    @LogActivity(actionType = "DELETE", entityType = "USER", description = "", severityLevel = "HIGH", entityIdParam = "id")
    @DeleteMapping("/{id}")
    @RequiresPermission(value = USERS_DELETE, level = "advanced", description = "Delete user")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @RequestHeader("Authorization") String token) {
        try {
            // Why: JPA cascade only works if you load the entity first. This ensures related entities are deleted as well.
            User targetUser = userRepository.findById(id).orElse(null);
            if (targetUser == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            // Get acting user from token
            String actingUserEmail = jwtTokenProvider.getEmailFromToken(token.replace("Bearer ", ""));
            User actingUser = userRepository.findByEmail(actingUserEmail).orElse(null);
            if (actingUser == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Acting user not found"));
            }

            // Role hierarchy check
            int actingLevel = actingUser.getRole().getLevel();
            int targetLevel = targetUser.getRole().getLevel();
            if (actingLevel <= targetLevel) {
                return ResponseEntity.status(403).body(Map.of("error", "You cannot delete a user with an equal or higher role."));
            }

            userRepository.delete(targetUser);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to delete user: " + e.getMessage()));
        }
    }

    // Update user status endpoint (for activate/deactivate action)
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            
            String status = body.get("status");
            if (status == null || status.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "status is required"));
            }
            
            user.setStatus(com.Ojt.Ecommerce.entity.UserStatus.valueOf(status));
            userRepository.save(user);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status value"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update user status: " + e.getMessage()));
        }
    }

    // Fix existing users with null status
    @PostMapping("/fix-null-status")
    public ResponseEntity<?> fixNullStatusUsers() {
        List<User> usersWithNullStatus = userRepository.findAll().stream()
                .filter(user -> user.getStatus() == null)
                .collect(Collectors.toList());

        for (User user : usersWithNullStatus) {
            user.setStatus(com.Ojt.Ecommerce.entity.UserStatus.ACTIVE);
            userRepository.save(user);
        }

        return ResponseEntity.ok(Map.of(
                "message", "Fixed " + usersWithNullStatus.size() + " users with null status",
                "fixedCount", usersWithNullStatus.size()
        ));
    }

    // Get user details endpoint (for view details modal)
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            return ResponseEntity.ok(new UserDTO(user));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get user: " + e.getMessage()));
        }
    }

    @PostMapping("/user/activity")
    public ResponseEntity<?> logUserActivity(@RequestBody Map<String, Object> payload) {
        try {
            Object userIdObj = payload.get("userId");
            Object typeObj = payload.get("type");
            
            if (userIdObj == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
            }
            
            if (typeObj == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "type is required"));
            }
            
            Long userId = Long.valueOf(userIdObj.toString());
            String type = typeObj.toString();
            
            userActivityService.logActivity(userId, type);
            return ResponseEntity.ok().build();
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid userId format"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to log activity: " + e.getMessage()));
        }
    }

    // Session management endpoints
    @PostMapping("/session/start")
    public ResponseEntity<?> startSession(@RequestBody Map<String, Object> payload) {
        try {
            // Log the incoming payload for debugging
            System.out.println("=== SESSION START REQUEST ===");
            System.out.println("Received session start payload: " + payload);
            System.out.println("Payload type: " + (payload != null ? payload.getClass().getSimpleName() : "null"));
            if (payload != null) {
                System.out.println("Payload keys: " + payload.keySet());
                System.out.println("Payload values: " + payload.values());
            }
            System.out.println("=============================");
            
            // Validate payload
            if (payload == null) {
                System.out.println("ERROR: Payload is null");
                return ResponseEntity.badRequest().body(Map.of("error", "Request body is required"));
            }

            // Safely extract and validate values
            Object userIdObj = payload.get("userId");
            Long userId = null;
            if (userIdObj != null) {
                try {
                    userId = Long.valueOf(userIdObj.toString());
                    if (userId < 0) {
                        return ResponseEntity.badRequest().body(Map.of("error", "userId must be non-negative"));
                    }
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid userId format"));
                }
            }
            
            Object sessionIdObj = payload.get("sessionId");
            String sessionId = null;
            if (sessionIdObj != null) {
                sessionId = sessionIdObj.toString().trim();
                System.out.println("Extracted sessionId: '" + sessionId + "'");
            } else {
                System.out.println("ERROR: sessionId is null in payload");
            }
            
            Object userAgentObj = payload.get("userAgent");
            String userAgent = userAgentObj != null ? userAgentObj.toString().trim() : "Unknown";
            
            Object ipAddressObj = payload.get("ipAddress");
            String ipAddress = ipAddressObj != null ? ipAddressObj.toString().trim() : "Unknown";

            // Validate required fields
            if (sessionId == null || sessionId.isEmpty()) {
                System.out.println("SessionId validation failed. sessionId: '" + sessionId + "'");
                System.out.println("Full payload keys: " + payload.keySet());
                return ResponseEntity.badRequest().body(Map.of("error", "sessionId is required"));
            }

            // Validate sessionId format (basic validation)
            if (!sessionId.matches("^[a-zA-Z0-9_-]+$")) {
                System.out.println("SessionId format validation failed: " + sessionId);
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid sessionId format"));
            }

            System.out.println("Processing session start - userId: " + userId + ", sessionId: " + sessionId);

            // Handle anonymous users (userId = 0 or null)
            if (userId == null || userId == 0) {
                sessionService.startSession(null, sessionId, userAgent, ipAddress);
            } else {
                sessionService.startSession(userId, sessionId, userAgent, ipAddress);
            }
            
            System.out.println("Session started successfully");
            return ResponseEntity.ok(Map.of("message", "Session started successfully"));
        } catch (Exception e) {
            System.err.println("Error in startSession: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to start session: " + e.getMessage()));
        }
    }

    @PostMapping("/session/page-view")
    public ResponseEntity<?> recordPageView(@RequestBody Map<String, Object> payload) {
        try {
            Object sessionIdObj = payload.get("sessionId");
            String sessionId = sessionIdObj != null ? sessionIdObj.toString() : null;
            
            if (sessionId == null || sessionId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "sessionId is required"));
            }
            
            sessionService.recordPageView(sessionId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to record page view: " + e.getMessage()));
        }
    }

    @PostMapping("/session/end")
    public ResponseEntity<?> endSession(@RequestBody Map<String, Object> payload) {
        try {
            Object sessionIdObj = payload.get("sessionId");
            String sessionId = sessionIdObj != null ? sessionIdObj.toString() : null;
            
            if (sessionId == null || sessionId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "sessionId is required"));
            }
            
            sessionService.endSession(sessionId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to end session: " + e.getMessage()));
        }
    }

    // Test endpoint to verify session is working
    @PostMapping("/session/test")
    public ResponseEntity<?> testSession(@RequestBody Map<String, Object> payload) {
        System.out.println("=== SESSION TEST ENDPOINT ===");
        System.out.println("Test payload received: " + payload);
        return ResponseEntity.ok(Map.of(
            "message", "Session test endpoint working",
            "receivedPayload", payload,
            "timestamp", System.currentTimeMillis()
        ));
    }

    // Get user total points endpoint
    @GetMapping("/{userId}/total-points")
    public ResponseEntity<Map<String, Object>> getUserTotalPoints(@PathVariable Long userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("totalPoints", user.getTotalPoints() != null ? user.getTotalPoints() : 0);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to get user total points");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
    // --- End customer management actions ---


