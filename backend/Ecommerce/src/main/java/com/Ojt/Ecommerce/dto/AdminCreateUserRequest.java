package com.Ojt.Ecommerce.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class AdminCreateUserRequest {
    // User fields
    private String name;
    private String email;
    private String password;
    private String gender;
    private LocalDate dateOfBirth;
    private String phoneNumber;
    private Boolean emailVerified;

    // Role (as string, e.g., 'admin', 'customer', etc.)
    private String role;

    // Address fields
    private String address; // street address
    private String city;
    private String state;
    private String postalCode;
    private String country;
    // Optionally: type (HOME/WORK/OTHER)
    private String addressType; // e.g., 'HOME', 'WORK', etc.
    
    // Welcome email flag
    private Boolean sendWelcomeEmail;
} 