package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.PermissionCategoryDTO;
import com.Ojt.Ecommerce.entity.PermissionCategory;

import java.util.List;

public interface PermissionCategoryService {
    List<PermissionCategoryDTO> getAllCategoriesWithPermissions();
}

