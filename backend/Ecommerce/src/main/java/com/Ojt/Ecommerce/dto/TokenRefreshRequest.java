package com.test.SpringSecurity.dto;


import lombok.Data;

@Data
public class TokenRefreshRequest {
    private String refreshToken;
}