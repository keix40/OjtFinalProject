package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

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

    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @Column(length = 45)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "userOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserOrderHasProduct> orderProducts;
}
