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
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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
    private final ModelMapper modelMapper;
    private final EmailService emailService;

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
                .dateOfBirth(request.getDateOfBirth())
                .gender((request.getGender()))
                .phoneNumber(request.getPhoneNumber())
                .createdDate(LocalDate.now())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(roleUser)
                .build();

        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiry(java.time.LocalDateTime.now().plusMinutes(10));

        // ✅ Save the user with OTP
        userRepository.save(user);

        // ✅ Send OTP via email
        emailService.sendEmail(user.getEmail(), "OTP Verification Code", "Your OTP is: " + otp);

        return "User registered successfully. Please check your email for OTP.";
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


    //update User method(kei_3)
    @Override
    public RegisterRequest updateUser(Long id, RegisterRequest dto){
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setGender(dto.getGender());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setDateOfBirth(dto.getDateOfBirth());

        userRepository.save(user);

        return modelMapper.map(user, RegisterRequest.class);
    }
}
