package com.Ojt.Ecommerce.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogActivity {
    String actionType() default ""; // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    String entityType() default ""; // PRODUCT, CATEGORY, BRAND, USER, etc.
    String description() default ""; // Custom description
    String severityLevel() default "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL
    boolean logChanges() default true; // Whether to log before/after changes
    String entityIdParam() default ""; // Parameter name containing entity ID
    String entityNameParam() default ""; // Parameter name containing entity name
} 