package com.Ojt.Ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(length = 45, nullable = false)
    private String name;

    @Column(length = 45, nullable = false, unique = true)
    private String email;

    @Column(length = 150, nullable = false)
    private String password;

    private LocalDateTime createdDate;

    @Column(length = 10)
    private String gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name="phone_number",length = 45)
    private String phoneNumber;

    @Column(name = "profile_image", columnDefinition = "TEXT")
    private String profileImage;

    @Column(name = "is_verified")
    private boolean verified = false;

    @Column(name = "phone_verified", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean phoneVerified = false;

//    @Column(name = "is_verified")
//    private boolean isVerified = false;

    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "otp_code")
    private String otpCode;

    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry;

    @Column(name = "total_points")
    private Integer totalPoints;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", referencedColumnName = "id")
    private Role role;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonBackReference
    private List<UserOrder> orders;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Purchase> purchases;



    //add for first time buyer discount buy pmk july 7
    @Column(name = "order_count")
    private Integer orderCount = 0;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Review> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserCouponUsage> couponUsages;


    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<SavedCard> savedCards;

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
    }



    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    public String getTier() {
        if (totalPoints == null) return "Regular";
        if (totalPoints < 10000) return "Regular";
        if (totalPoints < 100000) return "Silver";
        if (totalPoints < 1000000) return "Gold";
        return "Platinum";
    }

    /**
     * Safely get phoneVerified status, ensuring it's never null
     */
    public boolean isPhoneVerified() {
        return phoneVerified;
    }

    /**
     * Safely set phoneVerified status
     */
    public void setPhoneVerified(boolean phoneVerified) {
        this.phoneVerified = phoneVerified;
    }

    // Calculate current period spending (last 30 days)
    public double getCurrentPeriodSpent() {
        if (orders == null || orders.isEmpty()) {
            return 0.0;
        }

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return orders.stream()
                .filter(order -> order.getOrderDate() != null &&
                               order.getOrderDate().isAfter(thirtyDaysAgo))
                .mapToDouble(order -> {
                    if (order.getOrderProducts() != null) {
                        return order.getOrderProducts().stream()
                                .mapToDouble(product -> product.getUnitPrice() * product.getQuantity())
                                .sum();
                    }
                    return 0.0;
                })
                .sum();
    }

    // Calculate previous period spending (30-60 days ago)
    public double getPreviousPeriodSpent() {
        if (orders == null || orders.isEmpty()) {
            return 0.0;
        }

        LocalDateTime sixtyDaysAgo = LocalDateTime.now().minusDays(60);
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        return orders.stream()
                .filter(order -> order.getOrderDate() != null &&
                               order.getOrderDate().isAfter(sixtyDaysAgo) &&
                               order.getOrderDate().isBefore(thirtyDaysAgo))
                .mapToDouble(order -> {
                    if (order.getOrderProducts() != null) {
                        return order.getOrderProducts().stream()
                                .mapToDouble(product -> product.getUnitPrice() * product.getQuantity())
                                .sum();
                    }
                    return 0.0;
                })
                .sum();
    }

    // Calculate spending change percentage
    public double getSpendingChangePercentage() {
        double currentPeriod = getCurrentPeriodSpent();
        double previousPeriod = getPreviousPeriodSpent();

        if (previousPeriod == 0) {
            return currentPeriod > 0 ? 100.0 : 0.0; // If no previous spending but current spending, show 100% growth
        }

        return ((currentPeriod - previousPeriod) / previousPeriod) * 100;
    }

    // Get spending trend (up/down)
    public String getSpendingTrend() {
        double change = getSpendingChangePercentage();
        return change >= 0 ? "up" : "down";
    }
}