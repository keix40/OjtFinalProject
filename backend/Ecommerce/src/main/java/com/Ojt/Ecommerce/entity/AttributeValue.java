package com.Ojt.Ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "attribute_value")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttributeValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50)
    private String value;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attribute_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Attribute attribute;

    @Column(name = "status", columnDefinition = "INT DEFAULT 1")
    private Integer status;

    @PrePersist
    public void prePersist() {
        if (status == null) {
            status = 1;
        }
    }
}
