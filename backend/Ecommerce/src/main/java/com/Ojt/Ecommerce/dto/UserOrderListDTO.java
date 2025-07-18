package com.Ojt.Ecommerce.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class UserOrderListDTO {
    private Long orderId;
    private String orderCode;
    private LocalDateTime orderDate;
    private LocalDateTime updatedDate;
    private String status;
    private String deliveryMethod;
    private String deliveryService;
    private Double deliveryFee;
    private String discountType;
    private String discountCode;
    private Double discountValue;
    private Long subtotal;
    private Long discountAmount;
    private Long total;
    private List<OrderProductDTO> products;
    private AddressDTO address;
    private UserDTO user;
    private List<StatusHistoryDTO> statusHistory;
    private List<ReturnRequestDTO> returnRequests;
}
