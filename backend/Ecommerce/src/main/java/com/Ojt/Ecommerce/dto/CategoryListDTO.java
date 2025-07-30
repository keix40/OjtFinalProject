package com.Ojt.Ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryListDTO {
    private Long id;
    private String name;
    private String image;
    private List<CategoryListDTO> subcategories;
}
