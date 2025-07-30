package com.Ojt.Ecommerce.dto;

import lombok.Data;

import java.util.List;

@Data
public class SubCategoryDTO {
    private Long parentId;
    private List<String> subCategoryNames;
}
