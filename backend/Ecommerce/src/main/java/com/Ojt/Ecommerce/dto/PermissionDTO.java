package com.Ojt.Ecommerce.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor  // Required for Jackson serialization/deserialization
@AllArgsConstructor // Auto-generates constructor above
public class PermissionDTO {
    private Long id;
    private String key;
    private String name;
    private String description;
    private String level;
    private Long categoryId;  // minimal info
}
