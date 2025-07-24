package com.Ojt.Ecommerce.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_order")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_code")
    private String orderCode;

    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    private Address address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discount_id")
    private Discount discount;

    @Column(name = "user_discount_id")
    private Long userDiscountId;

    @OneToMany(mappedBy = "userOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserOrderHasProduct> orderProducts = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "delivery_method_id")
    private DeliveryMethod deliveryMethod;

    @OneToMany(mappedBy = "userOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderStatus> orderStatusHistory = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "saved_card_id")
    private SavedCard savedCard;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    @Builder.Default
    private List<ReturnRequest> returnRequests = new ArrayList<>();

    @Column(name = "delivery_fee", precision = 10, scale = 2)
    private BigDecimal deliveryFee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_service_id")
    private DeliveryService deliveryService;
}
