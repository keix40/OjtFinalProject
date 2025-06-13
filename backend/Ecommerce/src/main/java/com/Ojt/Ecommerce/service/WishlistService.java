package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Wishlist;
import com.Ojt.Ecommerce.repository.WishlistRepository;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WishlistService {
    @Autowired
    private ModelMapper mapper;

    @Autowired
    private WishlistRepository repo;

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

    public List<Wishlist> getAllWishlistByUserID(Long userId){
        return repo.findByUserIdAndStatus(userId,1);
    }
}
