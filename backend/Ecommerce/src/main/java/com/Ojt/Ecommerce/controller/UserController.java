package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;
import com.Ojt.Ecommerce.annotations.RequiresPermission;
import com.Ojt.Ecommerce.dto.RegisterRequest;
import com.Ojt.Ecommerce.dto.UserDTO;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import com.Ojt.Ecommerce.service.UserService;
import jakarta.transaction.Transactional;
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
    @RequiresPermission(value = "users.view", level = "basic")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers().stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }



    //to show userProfile userinfo (kei_1)
    @PutMapping("/{id}")
    @Transactional
    @RequiresPermission(value = "users.update", level = "intermediate",route = "/users/update") // add
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
    @RequiresPermission(value = "users.assign_role", level = "intermediate",route = "/users/assign") // add
    public ResponseEntity<String> assignRoleToUser(
            @PathVariable Long userId,
            @RequestParam Long roleId
    ) {
        userService.assignRoleToUser(userId, roleId);
        return ResponseEntity.ok("Role assigned successfully to user");
    }

    @GetMapping("/roles/{roleId}/users")
    @RequiresPermission(value = "users.view_by_role", level = "basic") // add
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

    @PostMapping("/createUser")
    public ResponseEntity<?> createUserByAdmin(){
        User user = new User();

        return null;
    }


}
