package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "delivery_service")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // e.g. "Standard Delivery", "Express Delivery"

    private BigDecimal feePerKm; // e.g. 500 MMK per km

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "address_id", referencedColumnName = "id")
    private Address baseAddress;

    @Column(name = "status", columnDefinition = "INT DEFAULT 1")
    private Integer status;

    @PrePersist
    public void prePersist() {
        if (status == null) {
            status = 1;
        }
    }

}
