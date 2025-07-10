package com.Ojt.Ecommerce.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApproveRejectRequest {
    private Long returnRequestId;
    private String adminRemark;
}
