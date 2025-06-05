package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.LoginRequest;
import com.Ojt.Ecommerce.dto.LoginResponse;
import com.Ojt.Ecommerce.dto.RegisterRequest;
import com.Ojt.Ecommerce.entity.OtpVerification;
import com.Ojt.Ecommerce.entity.RefreshToken;
import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.exception.CustomException;
import com.Ojt.Ecommerce.repository.OtpVerificationRepository;
import com.Ojt.Ecommerce.repository.RoleRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final EmailVerificationService emailVerificationService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;  // Inject RefreshTokenService
    private final EmailService emailService;
    private final OtpVerificationRepository otpVerificationRepository;
    private final ModelMapper modelMapper;

    @Override
    public String register(RegisterRequest request, MultipartFile profileImage) {
        String email = request.getEmail().trim().toLowerCase();


        OtpVerification otpVerification = otpVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("Email not verified or user not found"));


        if (!otpVerification.isVerified() || otpVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new CustomException("Email not verified or OTP expired. Please verify OTP before registering.");
        }

// Then check if user already exists (duplicate registration):
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            throw new CustomException("User already registered.");
        }



        // Validate DOB
        if (request.getDateOfBirth() == null) {
            throw new CustomException("Date of birth is required");
        }


        LocalDate dob = request.getDateOfBirth(); // No need to parse

        if (dob == null) {
            throw new CustomException("Date of birth is required");
        }

        LocalDate today = LocalDate.now();

        if (dob.isAfter(today)) {
            throw new CustomException("Date of birth cannot be in the future");
        }

        LocalDate minDate = today.minusYears(15);
        if (dob.isAfter(minDate)) {
            throw new CustomException("You must be at least 15 years old to register");
        }


        String otp = String.format("%06d", new Random().nextInt(999999));

        // Find default role
        Role roleUser = roleRepository.findById(6L)
                .orElseThrow(() -> new CustomException("Default role not found"));


        // Build user entity
        User user = new User();
        user.setName(request.getName());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(roleUser);
        user.setPhoneNumber(request.getPhoneNumber());
        user.setGender(request.getGender());
        user.setDateOfBirth(dob);
        user.setCreatedDate(LocalDateTime.now());
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        user.setVerified(true); // Set as verified if OTP is verified before
//        User user = User.builder()
//                .name(request.getName())
//                .email(request.getEmail())
//                .dateOfBirth(request.getDateOfBirth())
//                .gender((request.getGender()))
//                .phoneNumber(request.getPhoneNumber())
//                .createdDate(LocalDate.now())
//                .password(passwordEncoder.encode(request.getPassword()))
//                .role(roleUser)
//                .build();




        // Handle profile image if present
        if (profileImage != null && !profileImage.isEmpty()) {
            try {
                String uploadDir = System.getProperty("user.dir") + File.separator + "uploads";
                File uploadPath = new File(uploadDir);
                if (!uploadPath.exists()) {
                    uploadPath.mkdirs(); // ✅ create upload directory
                }
                ;

                String imageName = System.currentTimeMillis() + "_" + profileImage.getOriginalFilename();
                File dest = new File(uploadPath, imageName);
                profileImage.transferTo(dest);
                System.out.println("Uploading to absolute path: " + dest.getAbsolutePath());
                user.setProfileImage("/upload/" + imageName); // serve from /upload/** mapping
                System.out.println("Attempting to register with email: " + request.getEmail());
                System.out.println("Normalized email: " + request.getEmail().trim().toLowerCase());
                System.out.println("User found: " + userRepository.findByEmail(request.getEmail().trim().toLowerCase()));

            } catch (IOException e) {
                e.printStackTrace(); // ✅ Print full stack trace to console
                throw new CustomException("Failed to upload image: " + e.getMessage());
            }

        } else {
            // 👉 Use default image path
            user.setProfileImage("/upload/defaultProfile.png");
        }

        // Save user to database
        userRepository.save(user);

        String message  = "Your OTP code is: " + otp;
        emailService.sendEmail(user.getEmail(), "Email Verification Code", message);

        return "Registration successful. Please check your email for OTP verification.";
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
