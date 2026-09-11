package com.Ojt.Ecommerce.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class UserOrderDTO {
    @NotNull(message = "User id is required")
    private Long userId;

    @NotNull(message = "Address id is required")
    private Long addressId;

    private Long discountId;
    private Long deliveryId;
    private Double totalAmount;

    @NotEmpty(message = "Cart must contain at least one item")
    @Valid
    private List<CartDTO> cartItem;

    private Long cardId;
    private Long deliveryServiceId;
    private BigDecimal deliveryFee;
    private String couponName;
    private String couponDiscount;
}
