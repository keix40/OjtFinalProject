package com.Ojt.Ecommerce.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class BrandDTO {
    private Long id;
    private String brandName;
    private String image;
    private List<Long> categoryIds;
    private String categoryName;
}
