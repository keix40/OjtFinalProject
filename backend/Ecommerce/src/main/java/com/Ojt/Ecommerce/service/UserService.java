package com.Ojt.Ecommerce.service;



import com.Ojt.Ecommerce.dto.LoginRequest;
import com.Ojt.Ecommerce.dto.LoginResponse;
import com.Ojt.Ecommerce.dto.RegisterRequest;
import com.Ojt.Ecommerce.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserService {
    LoginResponse login(LoginRequest request);

    public String register(RegisterRequest request, MultipartFile profileImage);

    List<User> getAllUsers();

    public RegisterRequest updateUser(Long id, RegisterRequest userDTO);
    void assignRoleToUser(Long userId, Long roleId);
    public List<User> findUsersByRoleId(Long roleId) ;


}
