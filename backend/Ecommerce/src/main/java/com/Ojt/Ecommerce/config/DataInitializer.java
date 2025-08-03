package com.Ojt.Ecommerce.config;


import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.entity.Status;
import com.Ojt.Ecommerce.entity.StatusType;
import com.Ojt.Ecommerce.repository.RoleRepository;
import com.Ojt.Ecommerce.repository.StatusRepository;
import com.Ojt.Ecommerce.service.SecurityPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final SecurityPolicyService securityPolicyService;

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

        int[] levels = {6, 5, 4, 3, 2, 1};
        for (int i = 0; i < roles.size(); i++) {
            String roleName = roles.get(i);
            int level = levels[i];
            if (!roleRepository.existsByName(roleName)) {
                System.out.println("Creating role: " + roleName);
                roleRepository.save(Role.builder().name(roleName).level(level).build());
            }
        }
        
        // Seed security policy rules
        securityPolicyService.seedDefaultsIfEmpty();
        System.out.println("Security policy rules seeded successfully.");
    }

    @Bean
    public ApplicationRunner statusDataInitializer(StatusRepository statusRepository) {
        return args -> {
            for (StatusType type : StatusType.values()) {
                // Check if this status already exists
                if (statusRepository.findByName(type).isEmpty()) {
                    Status status = new Status();
                    status.setName(type);
                    statusRepository.save(status);
                    System.out.println("Inserted status: " + type);
                }
            }
        };
    }
}

