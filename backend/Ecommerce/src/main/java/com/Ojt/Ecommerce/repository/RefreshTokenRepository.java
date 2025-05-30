package com.test.SpringSecurity.repository;

import com.test.SpringSecurity.entity.RefreshToken;
import com.test.SpringSecurity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    int deleteByUser(User user);

    Optional<RefreshToken> findByUserId(Long userId);

}
