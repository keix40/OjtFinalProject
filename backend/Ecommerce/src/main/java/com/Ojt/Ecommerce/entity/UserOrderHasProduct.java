package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_order_has_product")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserOrderHasProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_order_id")
    private UserOrder userOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    private Integer quantity;

    @Column(name = "unit_price")
    private Double unitPrice;
}
