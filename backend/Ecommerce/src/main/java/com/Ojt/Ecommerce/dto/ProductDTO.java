package com.Ojt.Ecommerce.dto;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private String productName;
    private String productCode;
    private double price;
    private Long quantity;
    private String description;
    private List<CategoryBrandPair> categoryBrandPairs;
}
