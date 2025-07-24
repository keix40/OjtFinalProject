package com.Ojt.Ecommerce.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class PolicyResponseDTO {
    private Long id;
    private String title;
    private String content;
    private LocalDateTime lastUpdated;
}
