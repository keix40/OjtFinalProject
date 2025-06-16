package com.Ojt.Ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VariantDTO {
    private String name;
    private String sku;
    private double price;
    private int stock;
    private List<VariantAttributeDTO> attributes;  // attributeId, valueId, attributeName optional
//    private List<MultipartFile> images;
    // Add other fields like attributes if needed
}
