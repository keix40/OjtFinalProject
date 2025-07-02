package com.Ojt.Ecommerce.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class CategoryBrandPair {
    private Long categoryId;
    private String cateName;
    private Long brandId;
    private String brandName;
}
