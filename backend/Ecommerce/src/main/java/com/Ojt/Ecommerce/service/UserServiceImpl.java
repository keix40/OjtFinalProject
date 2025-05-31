package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.LoginRequest;
import com.Ojt.Ecommerce.dto.LoginResponse;
import com.Ojt.Ecommerce.dto.RegisterRequest;
import com.Ojt.Ecommerce.entity.RefreshToken;
import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.exception.CustomException;
import com.Ojt.Ecommerce.repository.RoleRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;  // Inject RefreshTokenService

    @Override
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException("Email already exists");
        }

        Role roleUser = roleRepository.findById(6L)
                .orElseThrow(() -> new CustomException("Default role not found"));

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(roleUser)
                .build();

        userRepository.save(user);

        return "User registered successfully";
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException("User not found"));

        String accessToken = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return new LoginResponse(accessToken, refreshToken.getToken());
    }
}
