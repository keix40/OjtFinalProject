package com.Ojt.Ecommerce.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderPreviewDTO {

    private List<CartDTO> cartItems;

    private double subtotal;

    private String discountName;

    private double discountAmount;

    private String discountReason;

    private double deliveryFee;

    private double total;

    private Long discountId;
} 