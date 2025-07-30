package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "return_request_products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnRequestProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_request_id", nullable = false)
    private ReturnRequest returnRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_product_id", nullable = false)
    private UserOrderHasProduct orderProduct;

    // Optional: quantity being returned, if partial return is allowed
    private Integer quantity;

    // Optional: comment per product
    private String productRemark;
}
