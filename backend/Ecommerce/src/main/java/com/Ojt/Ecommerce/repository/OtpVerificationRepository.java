package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository <OtpVerification,Long> {
    Optional<OtpVerification> findByEmail(String email);
}