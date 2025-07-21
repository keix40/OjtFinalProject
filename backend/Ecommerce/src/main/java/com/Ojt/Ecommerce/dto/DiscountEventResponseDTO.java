package com.Ojt.Ecommerce.dto;

import com.Ojt.Ecommerce.entity.DiscountType;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class DiscountEventResponseDTO {
    private Long id;
    private String name;
    private String code;
    private String description;
    private DiscountType discountType;
    private Double discountValue;
    private String startDate; // ISO string format
    private String endDate;   // ISO string format
    private boolean status;
    private Boolean autoApply;
    private List<Long> affectedProductIds;
    private List<DiscountDTO> discounts;
    private List<Long> productIds;
    private Long discountId;
}