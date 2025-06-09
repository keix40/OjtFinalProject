package com.Ojt.Ecommerce.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AttributeAndValueDTO {
    private Long attributeId;
    private String attributeName;
    private List<String> values;
}
