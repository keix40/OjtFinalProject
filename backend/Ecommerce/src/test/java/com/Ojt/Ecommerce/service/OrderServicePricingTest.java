package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.entity.ProductVariant;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class OrderServicePricingTest {

    @Test
    void resolveUnitPrice_prefersVariantPrice() {
        OrderService orderService = new OrderService();
        Product product = new Product();
        product.setId(1L);
        product.setPrice(99.0);
        ProductVariant variant = new ProductVariant();
        variant.setPrice(BigDecimal.valueOf(49.99));

        double price = ReflectionTestUtils.invokeMethod(orderService, "resolveUnitPrice", product, variant);
        assertEquals(49.99, price, 0.001);
    }

    @Test
    void resolveUnitPrice_fallsBackToProductPrice() {
        OrderService orderService = new OrderService();
        Product product = new Product();
        product.setId(2L);
        product.setPrice(25.0);

        double price = ReflectionTestUtils.invokeMethod(orderService, "resolveUnitPrice", product, null);
        assertEquals(25.0, price, 0.001);
    }
}
