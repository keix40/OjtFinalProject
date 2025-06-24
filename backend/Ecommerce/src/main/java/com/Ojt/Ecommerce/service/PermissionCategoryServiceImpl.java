package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.PermissionCategory;
import com.Ojt.Ecommerce.repository.PermissionCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PermissionCategoryServiceImpl implements PermissionCategoryService {

    private final PermissionCategoryRepository categoryRepository;

    @Autowired
    public PermissionCategoryServiceImpl(PermissionCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public List<PermissionCategory> getAllCategoriesWithPermissions() {
        return categoryRepository.findAll(); // fetches categories with permissions
    }
}

