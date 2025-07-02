package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.PermissionCategoryDTO;
import com.Ojt.Ecommerce.dto.PermissionDTO;
import com.Ojt.Ecommerce.entity.PermissionCategory;
import com.Ojt.Ecommerce.repository.PermissionCategoryRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PermissionCategoryServiceImpl implements PermissionCategoryService {

    private final PermissionCategoryRepository categoryRepository;
    private final ModelMapper modelMapper;

    @Autowired
    public PermissionCategoryServiceImpl(PermissionCategoryRepository categoryRepository, ModelMapper modelMapper) {
        this.categoryRepository = categoryRepository;
        this.modelMapper = modelMapper;
    }

    @Override
    public List<PermissionCategoryDTO> getAllCategoriesWithPermissions() {
        List<PermissionCategory> categories = categoryRepository.findAll();

        return categories.stream().map(category -> {
            // map category to DTO
            PermissionCategoryDTO dto = modelMapper.map(category, PermissionCategoryDTO.class);

            // map each permission to DTO
            List<PermissionDTO> permissionDTOs = category.getPermissions().stream().map(permission -> {
                PermissionDTO pdto = modelMapper.map(permission, PermissionDTO.class);
                pdto.setCategoryId(category.getId()); // set manually
                return pdto;
            }).toList();

            dto.setPermissions(permissionDTOs);
            return dto;
        }).toList();
    }
}

