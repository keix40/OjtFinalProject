package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist,Long> {
    @Query("SELECT w FROM Wishlist w WHERE w.user.id = :userId AND w.product.id = :proId")
    Optional<Wishlist> findWishlistByUserIdAndProductId(@Param("userId") Long userId, @Param("proId") Long proId);

    @Modifying
    @Query("Update Wishlist w set w.status = 0 where w.user.id = :userId AND w.product.id = :proId")
    public void removeWishlist(@Param("userId") Long userId, @Param("proId") Long proId);

    @Modifying
    @Query("Update Wishlist w set w.status = 1 where w.user.id = :userId AND w.product.id = :proId")
    public void readdWishlist(@Param("userId") Long userId, @Param("proId") Long proId);

    List<Wishlist> findByUserIdAndStatus(Long userId, int status);
}
