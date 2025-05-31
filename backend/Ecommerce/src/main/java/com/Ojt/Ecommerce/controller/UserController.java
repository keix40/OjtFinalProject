package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor  // Lombok annotation to generate constructor for final fields
public class UserController {

    private final UserService userService;  // Inject UserService

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
}
