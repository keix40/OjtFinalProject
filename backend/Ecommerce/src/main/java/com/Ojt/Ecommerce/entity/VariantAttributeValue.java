package com.Ojt.Ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "variant_attribute_value")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VariantAttributeValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attribute_value_id")
    private AttributeValue attributeValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variants_id")
    private ProductVariant productVariant;
}
