package com.Ojt.Ecommerce.entity;

public enum DiscountEventEnum {

    GLOBAL,
    PRODUCT,         // single product
    BRAND,           // all products in a brand
    CATEGORY,        // all products in a category
    BRAND_CATEGORY,  // specific category under a brand
    USER,
    USER_GLOBAL,
    USER_PRODUCT,
    USER_CATEGORY,
    USER_BRAND,
    USER_BRAND_CATEGORY,
    VIP_TIER

}
