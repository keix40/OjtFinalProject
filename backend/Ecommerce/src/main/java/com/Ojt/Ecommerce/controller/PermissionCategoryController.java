package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.entity.PermissionCategory;
import com.Ojt.Ecommerce.service.PermissionCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/permission-categories")
public class PermissionCategoryController {

    private final PermissionCategoryService categoryService;

    @Autowired
    public PermissionCategoryController(PermissionCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<PermissionCategory>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategoriesWithPermissions());
    }
}
