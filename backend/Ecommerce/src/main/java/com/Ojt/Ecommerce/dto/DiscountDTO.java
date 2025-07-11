package com.Ojt.Ecommerce.dto;

import com.Ojt.Ecommerce.entity.DiscountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class DiscountDTO {

    private Long id;
    private String name;
    private String code;
    private String description;
    private DiscountType discountType;
    private Double discountValue;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean status;
    private boolean canUse;
    private Boolean autoApply; // true = discount event, false = coupon

}
