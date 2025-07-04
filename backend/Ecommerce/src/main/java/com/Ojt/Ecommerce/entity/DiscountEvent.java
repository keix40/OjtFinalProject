package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "discount_event")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiscountEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private LocalDate startDate;
    private LocalDate endDate;

    @OneToMany(mappedBy = "discountEvent")
    private List<Discount> discounts;
}
