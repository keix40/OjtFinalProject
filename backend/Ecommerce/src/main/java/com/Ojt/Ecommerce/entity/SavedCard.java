package com.Ojt.Ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
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

    /** Stores only the last 4 digits — never the full PAN. Column name kept for schema compatibility. */
    @Column(name = "card_number", nullable = false, length = 4)
    private String lastFour;

    @Column(name = "expiry_date", nullable = false, length = 7)
    private String expiryDate;

    @Column(name = "card_brand", nullable = false, length = 20)
    private String cardBrand;

    @Column(name = "is_default")
    private boolean isDefault;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference
    private User user;

    @Column(name = "status", columnDefinition = "INT DEFAULT 1")
    private Integer status;

    /** Backward-compatible accessors — always last-4 only. */
    @JsonIgnore
    public String getCardNumber() {
        return lastFour;
    }

    public void setCardNumber(String cardNumber) {
        if (cardNumber != null && !cardNumber.isBlank()) {
            this.lastFour = com.Ojt.Ecommerce.util.CardMaskingUtil.maskForDisplay(cardNumber);
        }
    }

    @PrePersist
    public void prePersist() {
        if (status == null) {
            status = 1;
        }
    }
}
