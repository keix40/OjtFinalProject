package com.test.SpringSecurity.service;

import com.test.SpringSecurity.dto.LoginRequest;
import com.test.SpringSecurity.dto.LoginResponse;
import com.test.SpringSecurity.dto.RegisterRequest;
import com.test.SpringSecurity.entity.User;

import java.util.List;

public interface UserService {
    LoginResponse login(LoginRequest request);
    String register(RegisterRequest request);
    List<User> getAllUsers();

}
