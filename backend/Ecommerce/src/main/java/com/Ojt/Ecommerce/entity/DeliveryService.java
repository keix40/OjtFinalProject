package com.Ojt.Ecommerce.entity;

import java.math.BigDecimal;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    private String phoneNumber;

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
