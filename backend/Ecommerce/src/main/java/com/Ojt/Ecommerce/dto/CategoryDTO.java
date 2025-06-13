package com.Ojt.Ecommerce.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class CategoryDTO {
    private List<String> cateNames;
    private Long brandId;
    private String brandName;
    private Long parentId;
}
