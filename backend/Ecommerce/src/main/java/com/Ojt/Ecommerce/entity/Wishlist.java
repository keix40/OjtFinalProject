package com.Ojt.Ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "wishlist")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wishlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;


    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id")
    @JsonIgnoreProperties({"productCategories", "orderProducts", "productVariants", "wishlists", "purchaseProducts"})//add this line to fix json error
    private Product product;


    @Column(name = "status", columnDefinition = "INT DEFAULT 1")
    private Integer status;

    @Column(name = "wishlist_date")
    private LocalDateTime wishlistDate;

    @PrePersist
    public void prePersist() {
        if (status == null) {
            status = 1;
        }
    }
}
