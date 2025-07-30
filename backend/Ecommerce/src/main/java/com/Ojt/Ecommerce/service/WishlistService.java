package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.WishlistItemDTO;
import com.Ojt.Ecommerce.entity.DiscountRule;
import com.Ojt.Ecommerce.entity.Wishlist;
import com.Ojt.Ecommerce.repository.DiscountRuleRepository;
import com.Ojt.Ecommerce.repository.WishlistRepository;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistService {
    @Autowired
    private ModelMapper mapper;

    @Autowired
    private WishlistRepository repo;

    @Autowired
    private DiscountRuleRepository discountRuleRepository;

    public boolean existWishlist(Long userId, Long proId){
        return repo.findWishlistByUserIdAndProductId(userId,proId).isPresent();
    }

    public Wishlist saveWishlist(Wishlist wishlist){
        return repo.save(wishlist);
    }

    @Transactional
    public void removeWishlist(Long userId, Long proId) {
       repo.removeWishlist(userId, proId);
    }

    @Transactional
    public void readdWishlist(Long userId, Long proId) {
        repo.readdWishlist(userId, proId);
    }

    @Transactional
    public List<Wishlist> getAllWishlistByUserID(Long userId){
        return repo.findByUserIdAndStatusOrderByWishlistDateDesc(userId,1);
    }

    @Transactional
    public List<WishlistItemDTO> getWishlistWithDiscounts(Long userId) {
        List<Wishlist> wishlistItems = repo.findByUserIdAndStatusOrderByWishlistDateDesc(userId, 1);
        
        return wishlistItems.stream().map(wishlist -> {
            // Get the first product image URL
            String imageUrl = null;
            if (wishlist.getProduct().getProductImages() != null && !wishlist.getProduct().getProductImages().isEmpty()) {
                imageUrl = wishlist.getProduct().getProductImages().get(0).getImageUrl();
            }
            
            WishlistItemDTO dto = WishlistItemDTO.builder()
                .id(wishlist.getProduct().getId())
                .productName(wishlist.getProduct().getProductName())
                .originalPrice(wishlist.getProduct().getPrice())
                .imageUrl(imageUrl)
                .wishlistDate(wishlist.getWishlistDate())
                .hasDiscount(false)
                .build();

            // Check for active discounts
            DiscountRule discountRule = discountRuleRepository.findActiveProductDiscountRule(
                wishlist.getProduct().getId(), userId);
            
            if (discountRule != null && discountRule.getDiscount() != null) {
                dto.setHasDiscount(true);
                dto.setDiscountType(discountRule.getDiscount().getDiscountType().toString());
                dto.setDiscountValue(discountRule.getDiscount().getDiscountValue());
                dto.setDiscountName(discountRule.getDiscount().getName());
                
                // Calculate discounted price
                double originalPrice = wishlist.getProduct().getPrice();
                double discountedPrice = originalPrice;
                
                if (discountRule.getDiscount().getDiscountType().toString().equals("PERCENTAGE")) {
                    discountedPrice = originalPrice * (1 - discountRule.getDiscount().getDiscountValue());
                } else {
                    discountedPrice = Math.max(0, originalPrice - discountRule.getDiscount().getDiscountValue());
                }
                
                dto.setDiscountedPrice(Math.round(discountedPrice * 100.0) / 100.0);
            } else {
                dto.setDiscountedPrice(wishlist.getProduct().getPrice());
            }
            
            return dto;
        }).collect(Collectors.toList());
    }
}
