package com.Ojt.Ecommerce.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class BrandDTO {
    private String brandName;
    private List<Long> categoryIds;
    private String categoryName;
}
