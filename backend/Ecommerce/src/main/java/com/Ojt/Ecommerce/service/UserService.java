package com.Ojt.Ecommerce.service;



import com.Ojt.Ecommerce.dto.LoginRequest;
import com.Ojt.Ecommerce.dto.LoginResponse;
import com.Ojt.Ecommerce.dto.RegisterRequest;
import com.Ojt.Ecommerce.entity.User;

import java.util.List;

public interface UserService {
    LoginResponse login(LoginRequest request);
    String register(RegisterRequest request);
    List<User> getAllUsers();

}
