package com.test.SpringSecurity.config;

import com.test.SpringSecurity.entity.Role;
import com.test.SpringSecurity.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        if (!roleRepository.existsByName("STUDENT")) {
            System.out.println("Creating STUDENT role...");
            roleRepository.save(new Role("STUDENT"));
        }

        if (!roleRepository.existsByName("TEACHER")) {
            System.out.println("Creating TEACHER role...");
            roleRepository.save(new Role("TEACHER"));
        }
    }
}

