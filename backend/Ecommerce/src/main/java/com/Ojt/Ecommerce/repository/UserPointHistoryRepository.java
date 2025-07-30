package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.UserPointHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPointHistoryRepository extends JpaRepository<UserPointHistory, Long> {
    public UserPointHistory findByOrderId(Long id);
}
