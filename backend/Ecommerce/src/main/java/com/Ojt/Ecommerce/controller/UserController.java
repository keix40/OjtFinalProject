package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.RegisterRequest;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import com.Ojt.Ecommerce.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/auth/user")
@RequiredArgsConstructor  // Lombok annotation to generate constructor for final fields
public class UserController {

    private final UserService userService;  // Inject UserService
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

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

    @GetMapping("/all")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();  // Call service method to get users
        return ResponseEntity.ok(users);
    }


    //to show userProfile userinfo (kei_1)
    @PutMapping("/{id}")
    @Transactional
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
}
