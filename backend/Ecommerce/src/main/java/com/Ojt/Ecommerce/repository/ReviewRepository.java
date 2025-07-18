package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductIdOrderByTimestampDesc(Long productId);

    @Query("SELECT r FROM Review r WHERE r.rating = 5 ORDER BY r.timestamp DESC")
    List<Review> findTop3ByRatingFive();

    @Query("SELECT r FROM Review r WHERE r.user.id = :userId ORDER BY r.timestamp DESC")
    List<Review> findAllByUserId(@Param("userId") Long userId);

}
