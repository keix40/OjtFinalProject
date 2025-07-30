package com.Ojt.Ecommerce.dto;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@EqualsAndHashCode
public class AttributeAndValueDTO {
    private Long attributeId;
    private String attributeName;
    private List<AttributeValueDTO> values;

}
