package com.Ojt.Ecommerce.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

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
}
