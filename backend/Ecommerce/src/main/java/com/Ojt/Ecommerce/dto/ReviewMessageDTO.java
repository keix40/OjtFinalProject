package com.Ojt.Ecommerce.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ReviewMessageDTO {
    private Long id;
    private Long productId;
    private String username;
    private String userImage;
    private String comment;
    private int rating;
    private LocalDateTime timestamp;
    private String action;
    private List<String> imageUrls;
    private List<String> videoUrls;


    // Required: No-args constructor
    public ReviewMessageDTO() {}

    // All-args constructor
    public ReviewMessageDTO(Long id, Long productId, String username, String comment, int rating,
                            LocalDateTime timestamp, String action, String userImage,
                            List<String> imageUrls, List<String> videoUrls) {
        this.id = id;
        this.productId = productId;
        this.username = username;
        this.comment = comment;
        this.rating = rating;
        this.timestamp = timestamp;
        this.action = action;
        this.userImage = userImage;
        this.imageUrls = imageUrls != null ? imageUrls : new ArrayList<>();
        this.videoUrls = videoUrls != null ? videoUrls : new ArrayList<>();
    }
}

