package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Status;
import com.Ojt.Ecommerce.entity.StatusType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StatusRepository extends JpaRepository<Status,Long> {
    Optional<Status> findByName(StatusType statusType);
}
