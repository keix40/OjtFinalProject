package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.RefreshToken;
import com.Ojt.Ecommerce.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    int deleteByUser(User user);

    Optional<RefreshToken> findByUserId(Long userId);

}
