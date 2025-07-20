package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "vip_tiers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VipTier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    private Integer minPoints;

    @Column(length = 50)
    private String icon;

    @Column(length = 20)
    private String color;

    @Column(columnDefinition = "TEXT")
    private String benefits; // JSON or comma-separated string

    @Column(name = "tier_order")
    private Integer order;
} 