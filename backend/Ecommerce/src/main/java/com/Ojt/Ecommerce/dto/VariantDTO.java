package com.Ojt.Ecommerce.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class VariantDTO {
    private long id;
    private String name;
    private String sku;
    private double price;
    private int stock;
    private List<VariantAttributeDTO> attributes;  // attributeId, valueId, attributeName optional
//    private List<MultipartFile> images;
    // Add other fields like attributes if needed
    private Integer status; // <-- add this for soft delete support
}
