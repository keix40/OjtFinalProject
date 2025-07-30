package com.Ojt.Ecommerce.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.Ojt.Ecommerce.entity.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductIdOrderByTimestampDesc(Long productId);

    @Query("SELECT r FROM Review r WHERE r.rating = 5 ORDER BY r.timestamp DESC")
    List<Review> findTop3ByRatingFive();

    @Query("SELECT r FROM Review r WHERE r.user.id = :userId ORDER BY r.timestamp DESC")
    List<Review> findAllByUserId(@Param("userId") Long userId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double getAverageRatingByProductId(@Param("productId") Long productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    Long getReviewCountByProductId(@Param("productId") Long productId);

}
