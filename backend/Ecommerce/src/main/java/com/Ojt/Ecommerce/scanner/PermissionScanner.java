package com.Ojt.Ecommerce.scanner;

import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;
import com.Ojt.Ecommerce.annotations.RequiresPermission;
import com.Ojt.Ecommerce.entity.Permission;
import com.Ojt.Ecommerce.entity.PermissionCategory;
import com.Ojt.Ecommerce.repository.PermissionCategoryRepository;
import com.Ojt.Ecommerce.repository.PermissionRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.reflections.Reflections;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class PermissionScanner {

    private final PermissionRepository permissionRepo;
    private final PermissionCategoryRepository categoryRepo;

    @PostConstruct
    public void scanPermissions() {
        Reflections reflections = new Reflections("com.Ojt.Ecommerce.controller");

        Set<Class<?>> controllers = reflections.getTypesAnnotatedWith(PermissionCategoryTag.class);

        for (Class<?> controller : controllers) {
            PermissionCategoryTag catAnn = controller.getAnnotation(PermissionCategoryTag.class);

            String catKey = catAnn.value();
            String catName = catAnn.name().isEmpty() ? toTitle(catKey) : catAnn.name();
            String icon = catAnn.icon();

            // Create or fetch permission category
            PermissionCategory category = categoryRepo.findByKey(catKey)
                    .orElseGet(() -> categoryRepo.save(new PermissionCategory(catKey, catName, icon)));

            for (Method method : controller.getDeclaredMethods()) {
                if (method.isAnnotationPresent(RequiresPermission.class)) {
                    RequiresPermission permAnn = method.getAnnotation(RequiresPermission.class);
                    String key = permAnn.value();
                    String level = permAnn.level();
                    String description = permAnn.description();

                    if (!permissionRepo.existsByKey(key)) {
                        String name = extractNameFromKey(key);
                        Permission permission = new Permission(key, name, description, level, category);
                        permissionRepo.save(permission);
                        System.out.println("✅ Permission saved: " + key);
                    }
                }
            }
        }
    }

    private String extractNameFromKey(String key) {
        if (key.contains(".")) {
            String[] parts = key.split("\\.");
            String prefix = toTitle(parts[0]);
            String action = toTitle(parts[1]);
            return prefix + " " + action;
        }
        return toTitle(key);
    }

    private String toTitle(String raw) {
        String[] words = raw.replace("_", " ").split(" ");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            sb.append(Character.toUpperCase(word.charAt(0)))
                    .append(word.substring(1).toLowerCase())
                    .append(" ");
        }
        return sb.toString().trim();
    }

}
