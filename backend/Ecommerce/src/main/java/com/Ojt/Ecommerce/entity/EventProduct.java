package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "event_product")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventProduct {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private Events events;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;
}
