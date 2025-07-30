package com.Ojt.Ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "discount")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Discount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    @Column(unique = true)
    private String code; // Nullable: if null, it's auto apply

    @Enumerated(EnumType.STRING)
    private DiscountType discountType; // PERCENTAGE or FIXED

    private Double discountValue;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean autoApply;
    
    @Column(name = "minimum_spend")
    private Double minimumSpend;

    @ManyToOne
    @JoinColumn(name = "event_id" , nullable = true) // link to DiscountEvent
    private DiscountEvent discountEvent;

    @OneToMany(mappedBy = "discount", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<DiscountRule> discountRules;

    @OneToMany(mappedBy = "discount", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserCouponUsage> usedByUsers;

    private boolean status;

}