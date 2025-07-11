package com.Ojt.Ecommerce.dto;

import com.Ojt.Ecommerce.entity.RefundType;
import com.Ojt.Ecommerce.entity.RefundStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class RefundDTO {
    private Long id;
    private Long returnRequestId;
    private RefundType refundType;
    private BigDecimal refundAmount;
    private String refundMethod;
    private RefundStatus status;
    private String adminRemark;
    private LocalDateTime initiatedAt;
    private LocalDateTime completedAt;
    private Long receiveCardId;
}
