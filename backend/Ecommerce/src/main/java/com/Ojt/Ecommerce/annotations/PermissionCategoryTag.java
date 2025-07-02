package com.Ojt.Ecommerce.annotations;



import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.TYPE) // class level only
@Retention(RetentionPolicy.RUNTIME) // keep it at runtime
public @interface PermissionCategoryTag {
    String value();           // key like "users", "orders"
    String name() default ""; // display name like "User Management"
    String icon() default "fas fa-cog"; // icon for frontend
}
