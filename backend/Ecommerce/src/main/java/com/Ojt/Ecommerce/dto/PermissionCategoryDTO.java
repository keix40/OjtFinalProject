package com.Ojt.Ecommerce.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionCategoryDTO {
    private Long id;
    private String key;
    private String name;
    private String icon;
    private List<PermissionDTO> permissions;
}
