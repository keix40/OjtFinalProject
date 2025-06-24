package com.Ojt.Ecommerce.annotations;

// 📁 package com.Ojt.Ecommerce.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD) // for controller methods only
@Retention(RetentionPolicy.RUNTIME) // scan at runtime
public @interface RequiresPermission {
    String value();                   // key like "users.view"
    String level() default "basic";  // permission level
    String description() default "Auto-registered"; // optional
}
