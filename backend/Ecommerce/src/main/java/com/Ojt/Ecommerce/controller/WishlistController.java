package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.entity.Wishlist;
import com.Ojt.Ecommerce.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/wishlist")
public class WishlistController {
    @Autowired
    private WishlistService service;

    @PostMapping("/save/{userId}/{proId}")
    public ResponseEntity<?> saveWishlist(@PathVariable long userId, @PathVariable long proId) {
        if (service.existWishlist(userId, proId)) {
            service.readdWishlist(userId, proId);
            return ResponseEntity.ok("Wishlist re-added");
        } else {
            Wishlist wishlist = Wishlist.builder()
                    .user(User.builder().id(userId).build())
                    .product(Product.builder().id(proId).build())
                    .wishlistDate(LocalDateTime.now())
                    .build();

            service.saveWishlist(wishlist);
            return ResponseEntity.ok("Wishlist saved");
        }
    }

    @PutMapping("/remove/{userId}/{proId}")
    public ResponseEntity<?> removeWishlist(@PathVariable long userId, @PathVariable long proId) {
        if (service.existWishlist(userId, proId)) {
            service.removeWishlist(userId, proId);
            return ResponseEntity.ok("Wishlist removed successfully");
        } else {
            return ResponseEntity.badRequest().body("Wishlist item does not exist or is already removed");
        }
    }

    @GetMapping("/wishlistbyuserid/{id}")
    public List<Long> wishlistListByUserId(@PathVariable long id){
        List<Wishlist> wishlistItems = service.getAllWishlistByUserID(id);
        return wishlistItems.stream()
                .map(w -> w.getProduct().getId())
                .collect(Collectors.toList());
    }
}
