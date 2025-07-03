package com.Ojt.Ecommerce.dto;

import com.Ojt.Ecommerce.entity.DiscountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DiscountDTO {
    private Long id;
    private String code;
    private String name;
    private DiscountType discountType;
    private Double discountValue;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean canUse;
}
