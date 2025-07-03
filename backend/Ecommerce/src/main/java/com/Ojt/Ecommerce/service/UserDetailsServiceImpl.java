package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

//    @Override
//    @Transactional
//    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
//        User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
//
//        if (!user.isVerified()) {
//            throw new RuntimeException("Email not verified. Please verify your email.");
//        }
//
//
//        return new org.springframework.security.core.userdetails.User(
//                user.getEmail(),
//                user.getPassword(),
//                List.of(new SimpleGrantedAuthority(user.getRole().getName()))
//        );
//    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (!user.isVerified()) {
            throw new RuntimeException("Email not verified. Please verify your email.");
        }

        // 👉 Step 1: Get Role
        String roleName = user.getRole().getName(); // Example: "ADMIN"

        // 👉 Step 2: Get permissions from Role -> RolePermission -> Permission
        List<SimpleGrantedAuthority> authorities = user.getRole()
                .getRolePermissions()
                .stream()
                .map(rolePermission -> new SimpleGrantedAuthority(rolePermission.getPermission().getName()))
                .collect(Collectors.toList());

        // 👉 Step 3: Add role as authority too (optional, with prefix ROLE_)
        authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName));

        // 👉 Step 4: Return Spring Security User
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                authorities
        );
    }



}
