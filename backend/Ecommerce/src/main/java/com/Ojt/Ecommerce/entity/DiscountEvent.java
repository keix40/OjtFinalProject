package com.Ojt.Ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
public class DiscountEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String event_name;
    
    private String description;

    private double discount_percent;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private boolean status;

    @OneToMany(mappedBy = "discountEvent")
    private List<Discount> discounts;
}
