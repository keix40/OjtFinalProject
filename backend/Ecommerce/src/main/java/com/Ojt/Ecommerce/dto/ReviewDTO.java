package com.Ojt.Ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDTO {
    private Long id;
    private String comment;
    private int rating;
    private LocalDateTime timestamp;
    private String userName;
    private String userImage;
    private String productName;
    private List<ReviewMediaDTO> mediaList;
}
