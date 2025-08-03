package com.Ojt.Ecommerce.entity;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

public enum NotificationTypeEnum {

    ADMIN,
    CUSTOMER,
    MANAGER,
    SALES_MARKETING,
    WAREHOUSE_STAFF,
    CUSTOMER_SUPPORT
}
