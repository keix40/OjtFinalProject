package com.Ojt.Ecommerce.config;


import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {

        List<String> roles = List.of(
                "ADMIN",
                "MANAGER",
                "SALES/MARKETING",
                "CUSTOMER SUPPORT",
                "WAREHOUSE STAFF",
                "CUSTOMER"
        );

        for (String roleName : roles) {
            if (!roleRepository.existsByName(roleName)) {
                System.out.println("Creating role: " + roleName);
                roleRepository.save(Role.builder().name(roleName).build());
            }
        }
    }
}

