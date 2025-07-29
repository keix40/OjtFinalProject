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

    @Column(nullable = false)
    private Integer weight = 5;

    @Column(length = 50)
    private String icon;

    @Column(length = 20)
    private String color;

    @Column(name = "tier_order")
    private Integer order;

    public int getTierLevel(String tierName) {
        switch (tierName.toUpperCase()) {
            case "PLATINUM": return 4;
            case "GOLD": return 3;
            case "SILVER": return 2;
            case "REGULAR":
            default: return 1;
        }
    }
} 