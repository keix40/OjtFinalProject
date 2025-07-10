package com.Ojt.Ecommerce.dto;

import com.Ojt.Ecommerce.entity.DiscountType;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class DiscountResponseDTO {
    private Long id;
    private String name;
    private String code;
    private DiscountType discountType;
    private Double discountValue;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean autoApply;
    private Long discountEventId;
    private List<Long> productIds;
}
