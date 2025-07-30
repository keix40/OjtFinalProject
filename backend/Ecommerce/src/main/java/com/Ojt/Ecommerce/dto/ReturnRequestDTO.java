package com.Ojt.Ecommerce.dto;

import com.Ojt.Ecommerce.entity.ReturnReason;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class ReturnRequestDTO {
    private Long id;
    private Long userId;
    private String userName;
    private Long orderId;
    private String orderCode;
    private LocalDateTime orderDate;
    private Long cardId;
    private String cardNumber;
    private ReturnReason reasonForReturn;
    private String returnDetail;
    private String status;
    private String adminRemark;
    private LocalDateTime requestedAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime decisionAt;
    private List<String> imageUrls;
    private Long refundId;
    private BigDecimal refundAmount;
    private String refundAdminRemark;
    private LocalDateTime initiatedAt;
    private LocalDateTime completedAt;
    private String refundStatus;
    private String refundType;
    private List<ReturnRequestProductDTO> products;
}

