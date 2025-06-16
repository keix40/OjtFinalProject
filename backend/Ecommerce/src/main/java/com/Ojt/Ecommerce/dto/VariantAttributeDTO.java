package com.Ojt.Ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VariantAttributeDTO {
    private Long attributeId;
    private Long valueId;
    private String attributeName;  // optional
}