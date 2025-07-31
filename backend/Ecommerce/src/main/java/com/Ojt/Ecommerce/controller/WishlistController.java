package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.WishlistItemDTO;
import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.entity.Wishlist;
import com.Ojt.Ecommerce.repository.ProductRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.Ojt.Ecommerce.annotations.LogActivity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/wishlist")
public class WishlistController {
    @Autowired
    private WishlistService service;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProductRepository productRepository;

    @LogActivity(actionType = "CREATE", entityType = "WISHLIST", description = "Added product to wishlist", severityLevel = "LOW")
    @PostMapping("/save/{userId}/{proId}")
    public ResponseEntity<?> saveWishlist(@PathVariable long userId, @PathVariable long proId) {
        if (service.existWishlist(userId, proId)) {
            service.readdWishlist(userId, proId);
            return ResponseEntity.ok("Wishlist re-added");
        } else {
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
            Product product = productRepository.findById(proId).orElseThrow(() -> new RuntimeException("Product not found"));
            
            Wishlist wishlist = Wishlist.builder()
                    .user(user)
                    .product(product)
                    .wishlistDate(LocalDateTime.now())
                    .build();

            service.saveWishlist(wishlist);
            return ResponseEntity.ok("Wishlist saved");
        }
    }

    @LogActivity(actionType = "DELETE", entityType = "WISHLIST", description = "Removed product from wishlist", severityLevel = "LOW")
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
    public List<Long> wishlistListIDByUserId(@PathVariable long id){
        List<Wishlist> wishlistItems = service.getAllWishlistByUserID(id);
        return wishlistItems.stream()
                .map(w -> w.getProduct().getId())
                .collect(Collectors.toList());
    }

    @GetMapping("/getwishlist/{id}")
    public ResponseEntity<List<Wishlist>> wishlistListByUserId(@PathVariable long id){
        List<Wishlist> list = service.getAllWishlistByUserID(id);
        return ResponseEntity.ok(list != null ? list : new ArrayList<>());
    }

    @GetMapping("/getwishlistwithdiscounts/{id}")
    public ResponseEntity<List<WishlistItemDTO>> getWishlistWithDiscounts(@PathVariable long id){
        List<WishlistItemDTO> list = service.getWishlistWithDiscounts(id);
        return ResponseEntity.ok(list != null ? list : new ArrayList<>());
    }

}
