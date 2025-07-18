package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.BlockedIP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Repository
public interface BlockedIPRepository extends JpaRepository<BlockedIP, Long> {
    Optional<BlockedIP> findByIpAddress(String ipAddress);
    List<BlockedIP> findAllByIpAddress(String ipAddress);
    void deleteByIpAddress(String ipAddress);
    List<BlockedIP> findByBlockedUntilBefore(LocalDateTime now);
} 