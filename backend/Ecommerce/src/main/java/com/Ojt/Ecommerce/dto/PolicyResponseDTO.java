package com.Ojt.Ecommerce.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PolicyResponseDTO {
    private Long id;
    private String title;
    private String content;
    private Integer status;
    private LocalDateTime lastUpdated;
}
