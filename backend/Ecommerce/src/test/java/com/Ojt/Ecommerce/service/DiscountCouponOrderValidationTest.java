package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Discount;
import com.Ojt.Ecommerce.entity.DiscountType;
import com.Ojt.Ecommerce.repository.DiscountRepository;
import com.Ojt.Ecommerce.repository.DiscountRuleRepository;
import com.Ojt.Ecommerce.repository.ProductDiscountRepository;
import com.Ojt.Ecommerce.repository.ProductRepository;
import com.Ojt.Ecommerce.repository.UserCouponUsageRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.repository.VipTierRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiscountCouponOrderValidationTest {

    @Mock private DiscountRepository discountRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ProductDiscountRepository productDiscountRepository;
    @Mock private DiscountRuleRepository discountRuleRepository;
    @Mock private UserCouponUsageRepository userCouponUsageRepository;
    @Mock private UserRepository userRepository;
    @Mock private VipTierRepository vipTierRepository;
    @Mock private DiscountRuleService discountRuleService;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private DiscountCouponService discountCouponService;

    private Discount autoApplyDiscount;

    @BeforeEach
    void setUp() {
        autoApplyDiscount = Discount.builder()
                .id(99L)
                .name("Auto Admin")
                .code("AUTO99")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(0.10)
                .startDate(LocalDate.now().minusDays(1))
                .endDate(LocalDate.now().plusDays(30))
                .autoApply(true)
                .status(true)
                .build();
    }

    @Test
    void requireEligibleDiscountForOrder_rejectsAutoApplyDiscount() {
        when(discountRepository.findById(99L)).thenReturn(Optional.of(autoApplyDiscount));
        when(discountRepository.findByCode("AUTO99")).thenReturn(Optional.of(autoApplyDiscount));

        assertThrows(AccessDeniedException.class, () ->
                discountCouponService.requireEligibleDiscountForOrder(1L, 99L, List.of(1L)));
    }
}
