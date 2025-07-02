package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "discount")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Discount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String code; // Nullable: if null, it's auto apply

    @Enumerated(EnumType.STRING)
    private DiscountType discountType; // PERCENTAGE or FIXED

    private Double discountValue;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean autoApply;

    @OneToMany(mappedBy = "discount")
    private List<UserCouponUsage> usedByUsers;

    @OneToMany(mappedBy = "discount", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductDiscount> productDiscounts;

}
