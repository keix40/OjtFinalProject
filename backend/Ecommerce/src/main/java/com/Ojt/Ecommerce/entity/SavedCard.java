package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "saved_cards")
public class SavedCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cardholder_name", nullable = false)
    private String cardholderName;

    @Column(name = "card_number", nullable = false, length = 20)
    private String cardNumber;

    @Column(name = "expiry_date", nullable = false, length = 7)
    private String expiryDate;  // e.g. "12 / 24"

    @Column(name = "card_brand", nullable = false, length = 20)
    private String cardBrand;

    @Column(name = "is_default")
    private boolean isDefault;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
