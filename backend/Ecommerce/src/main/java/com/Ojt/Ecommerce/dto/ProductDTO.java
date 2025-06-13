package com.Ojt.Ecommerce.dto;
import lombok.*;
import org.hibernate.sql.exec.spi.StandardEntityInstanceResolver;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private Long id;
    private String productName;
    private String productCode;
    private double price;
    private Long quantity;
    private String description;
    private Long status;

    private List<CategoryBrandPair> categoryBrandPairs;
    private List<ProductImageDTO> productImages;

}
