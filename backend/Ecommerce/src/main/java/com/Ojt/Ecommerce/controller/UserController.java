package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;
import com.Ojt.Ecommerce.annotations.RequiresPermission;
import com.Ojt.Ecommerce.annotations.LogActivity;
import com.Ojt.Ecommerce.dto.RegisterRequest;
import com.Ojt.Ecommerce.dto.UserDTO;
import com.Ojt.Ecommerce.dto.AdminCreateUserRequest;
import com.Ojt.Ecommerce.dto.AddressDTO;
import com.Ojt.Ecommerce.dto.CustomerSummaryDTO;
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
    public ResponseEntity<Map<String, Object>>  updateUser(@PathVariable Long id ,@RequestBody RegisterRequest dto,@RequestHeader("Authorization") String token){
        RegisterRequest updatedUser = userService.updateUser(id,dto);

        User user = userRepository.findById(id).orElseThrow();
        String newToken = jwtTokenProvider.generateToken(user);

        // Create response with both updated user and new token
        Map<String, Object> response = new HashMap<>();
        response.put("user", updatedUser);
        response.put("token", newToken);
        return  ResponseEntity.ok(response);

    }

    @PutMapping("/{userId}/assign-role")
    @RequiresPermission(value = USERS_ASSIGN_ROLE, level = "advanced", description = "Assign roles to users")
    public ResponseEntity<String> assignRoleToUser(
            @PathVariable Long userId,
            @RequestParam Long roleId
    ) {
        userService.assignRoleToUser(userId, roleId);
        return ResponseEntity.ok("Role assigned successfully to user");
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
    @LogActivity(actionType = "DELETE", entityType = "USER", description = "Deleted user", severityLevel = "HIGH", entityIdParam = "id")
    @DeleteMapping("/{id}")
    @RequiresPermission(value = USERS_DELETE, level = "advanced", description = "Delete user")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @RequestHeader("Authorization") String token) {
        // Why: JPA cascade only works if you load the entity first. This ensures related entities are deleted as well.
        User targetUser = userRepository.findById(id).orElseThrow();

        // Get acting user from token
        String actingUserEmail = jwtTokenProvider.getEmailFromToken(token.replace("Bearer ", ""));
        User actingUser = userRepository.findByEmail(actingUserEmail).orElseThrow();

        // Role hierarchy check
        int actingLevel = actingUser.getRole().getLevel();
        int targetLevel = targetUser.getRole().getLevel();
        if (actingLevel <= targetLevel) {
            return ResponseEntity.status(403).body("You cannot delete a user with an equal or higher role.");
        }

        userRepository.delete(targetUser);
        return ResponseEntity.ok().build();
    }

    // Update user status endpoint (for activate/deactivate action)
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id).orElseThrow();
        user.setStatus(com.Ojt.Ecommerce.entity.UserStatus.valueOf(body.get("status")));
        userRepository.save(user);
        return ResponseEntity.ok().build();
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
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow();
        return ResponseEntity.ok(new UserDTO(user));
    }

    @PostMapping("/user/activity")
    public ResponseEntity<?> logUserActivity(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        String type = payload.get("type").toString();
        userActivityService.logActivity(userId, type);
        return ResponseEntity.ok().build();
    }
    // --- End customer management actions ---


}
