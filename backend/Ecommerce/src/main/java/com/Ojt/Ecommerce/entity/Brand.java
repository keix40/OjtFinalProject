package com.Ojt.Ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "brand")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(onlyExplicitlyIncluded = true)
public class Brand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "brand")
    @JsonIgnore
    @ToString.Exclude  // ✅ Add this
    @EqualsAndHashCode.Exclude
    private List<Product> products;

    @OneToMany(mappedBy = "brand", cascade = CascadeType.ALL)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<BrandHasCategory> brandCategories;

    @Column(name = "image", columnDefinition = "TEXT")
    private String image;

    @Column(name = "status", columnDefinition = "INT DEFAULT 1")
    private Integer status;

    @PrePersist
    public void prePersist() {
        if (status == null) {
            status = 1;
        }
    }
}
