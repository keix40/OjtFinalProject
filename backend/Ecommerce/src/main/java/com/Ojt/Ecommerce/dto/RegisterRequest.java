package com.Ojt.Ecommerce.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String gender;
    private LocalDate dateOfBirth;
    private String phoneNumber;
}
