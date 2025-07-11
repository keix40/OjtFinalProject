package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.LoginRequest;
import com.Ojt.Ecommerce.dto.LoginResponse;
import com.Ojt.Ecommerce.dto.RegisterRequest;
import com.Ojt.Ecommerce.dto.AdminCreateUserRequest;
import com.Ojt.Ecommerce.dto.AddressDTO;
import com.Ojt.Ecommerce.dto.CustomerSummaryDTO;
import com.Ojt.Ecommerce.entity.OtpVerification;
import com.Ojt.Ecommerce.entity.RefreshToken;
import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.entity.AddressType;
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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import com.Ojt.Ecommerce.entity.Discount;
import com.Ojt.Ecommerce.entity.DiscountEventEnum;
import com.Ojt.Ecommerce.entity.DiscountRule;
import com.Ojt.Ecommerce.repository.DiscountRepository;
import com.Ojt.Ecommerce.repository.DiscountRuleRepository;
import com.Ojt.Ecommerce.entity.DiscountType;

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
    private final NotificationService notificationService;
    private final AddressService addressService;
    private final DiscountRepository discountRepository;
    private final DiscountRuleRepository discountRuleRepository;

    // Method to ensure "First Time Buyer" discount exists
    private void ensureFirstTimeBuyerDiscountExists() {
        Discount firstTimeDiscount = discountRepository.findByName("First Time Buyer").orElse(null);
        if (firstTimeDiscount == null) {
            // Create the "First Time Buyer" discount if it doesn't exist
            firstTimeDiscount = new Discount();
            firstTimeDiscount.setName("First Time Buyer");
            firstTimeDiscount.setDescription("10% discount for first-time buyers");
            firstTimeDiscount.setDiscountType(DiscountType.PERCENTAGE);
            firstTimeDiscount.setDiscountValue(0.10); // 10% discount
            firstTimeDiscount.setStartDate(LocalDate.now());
            firstTimeDiscount.setEndDate(LocalDate.now().plusYears(10)); // Valid for 10 years
            firstTimeDiscount.setStatus(true);
            discountRepository.save(firstTimeDiscount);
        }
    }

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

        // Ensure the first-time buyer discount exists and assign it to new user
        try {
            ensureFirstTimeBuyerDiscountExists();
            Discount firstTimeDiscount = discountRepository.findByName("First Time Buyer").orElse(null);
            if (firstTimeDiscount != null) {
                DiscountRule rule = new DiscountRule();
                rule.setTargetType(DiscountEventEnum.USER);
                rule.setDiscount(firstTimeDiscount);
                rule.setUser(user);
                rule.setStartDate(LocalDate.now());
                rule.setEndDate(LocalDate.now().plusDays(7));
                System.out.println("Saving DiscountRule for user: " + user.getEmail());
                discountRuleRepository.save(rule);
                System.out.println("Saved DiscountRule for user: " + user.getEmail());

            }
        } catch (Exception e) {
            // Log or handle error if discount assignment fails
            System.err.println("Failed to assign first-time buyer discount: " + e.getMessage());
        }

        String message  = "Your OTP code is: " + otp;
        emailService.sendEmail(user.getEmail(), "Email Verification Code", message);

        return "Registration successful. Please check your email for OTP verification.";
    }

    @Override
    public User createUserByAdmin(AdminCreateUserRequest request) {
        // 1. Find role by name
        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new RuntimeException("Role not found: " + request.getRole()));

        // 2. Create User entity
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setGender(request.getGender());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(role);
        user.setVerified(true); // Admin-created users are verified by default
        user.setCreatedDate(java.time.LocalDateTime.now());
        userRepository.save(user);

        // 3. Create Address if provided
        if (request.getAddress() != null && !request.getAddress().isEmpty()) {
            AddressDTO addressDTO = new AddressDTO();
            addressDTO.setAddress(request.getAddress());
            addressDTO.setCity(request.getCity());
            addressDTO.setState(request.getState());
            addressDTO.setPostalCode(request.getPostalCode());
            addressDTO.setCountry(request.getCountry());
            addressDTO.setUserId(user.getId());
            if (request.getAddressType() != null) {
                try {
                    addressDTO.setType(AddressType.valueOf(request.getAddressType().toUpperCase()));
                } catch (Exception e) {
                    addressDTO.setType(AddressType.HOME); // default
                }
            } else {
                addressDTO.setType(AddressType.HOME);
            }
            addressService.addNewAddress(addressDTO);
        }
        return user;
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
        notificationService.sendNotification(user.getEmail(), "Your profile was updated successfully!");

        return modelMapper.map(user, RegisterRequest.class);
    }

    @Override
    public String uploadProfileImage(String token, MultipartFile image) {  //add for profile avatar update by pmk june 13
        if (image == null || image.isEmpty()) {
            throw new CustomException("No image file provided");
        }

        String email = jwtTokenProvider.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found"));

        try {
            String uploadDir = System.getProperty("user.dir") + File.separator + "uploads";
            File uploadPath = new File(uploadDir);
            if (!uploadPath.exists()) {
                uploadPath.mkdirs();
            }

            String imageName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
            File dest = new File(uploadPath, imageName);
            image.transferTo(dest);

            String imagePath = "/uploads/" + imageName;
            user.setProfileImage(imagePath);
            userRepository.save(user);

            return imagePath;
        } catch (IOException e) {
            e.printStackTrace();
            throw new CustomException("Failed to upload profile image: " + e.getMessage());
        }
    }

    //add method
    @Override
    public void assignRoleToUser(Long userId, Long roleId) {
        Optional<User> optionalUser = userRepository.findById(userId);
        Optional<Role> optionalRole = roleRepository.findById(roleId);

        if (optionalUser.isEmpty()) {
            throw new RuntimeException("User not found with ID: " + userId);
        }

        if (optionalRole.isEmpty()) {
            throw new RuntimeException("Role not found with ID: " + roleId);
        }

        User user = optionalUser.get();
        Role role = optionalRole.get();

        user.setRole(role);
        userRepository.save(user);
    }

    public List<User> findUsersByRoleId(Long roleId) {
        return userRepository.findByRoleId(roleId);
    }

    @Override
    public List<CustomerSummaryDTO> getAllCustomerSummaries() {
        List<User> customers = userRepository.findByRole_Name("CUSTOMER");
        List<CustomerSummaryDTO> result = new java.util.ArrayList<>();
        for (User user : customers) {
            int totalOrders = user.getOrders() != null ? user.getOrders().size() : 0;
            double totalSpent = 0.0;
            if (user.getOrders() != null) {
                for (var order : user.getOrders()) {
                    if (order.getOrderProducts() != null) {
                        for (var op : order.getOrderProducts()) {
                            if (op.getProduct() != null && op.getProduct().getPrice() != null && op.getQuantity() != null) {
                                totalSpent += op.getProduct().getPrice() * op.getQuantity();
                            }
                        }
                    }
                }
            }
            result.add(new CustomerSummaryDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getStatus() != null ? user.getStatus().name() : null,
                user.getRole() != null ? user.getRole().getName() : null,
                user.getCreatedDate(),
                totalOrders,
                totalSpent,
                user.getProfileImage()
            ));
        }
        return result;
    }

    @Override
    public List<CustomerSummaryDTO> getCustomersForReport() {
        // This method returns the same data as getAllCustomerSummaries
        // but is specifically named for report generation to maintain clear separation of concerns
        return getAllCustomerSummaries();
    }

}