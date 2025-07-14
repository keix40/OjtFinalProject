package com.Ojt.Ecommerce.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UserOrderDTO {
    private Long userId;
    private Long addressId;
    private Long discountId;
    private Long deliveryId;
    private Double totalAmount;
    private List<CartDTO> cartItem;
    private Long cardId;

}
