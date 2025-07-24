package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.CategoryListDTO;
import com.Ojt.Ecommerce.dto.SubCategoryDTO;
import com.Ojt.Ecommerce.entity.Category;
import com.Ojt.Ecommerce.entity.ProductHasCategory;
import com.Ojt.Ecommerce.repository.CategoryRepository;
import com.Ojt.Ecommerce.repository.ProductHasCategoryRepository;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class CategoryService {
    private static final Path uploadPath = Paths.get("brand_and_category_image").toAbsolutePath();

    @Autowired
    private CategoryRepository repo;

    @Autowired
    private ProductHasCategoryRepository pcRepo;

    @Autowired
    private ModelMapper mapper;

    public List<Category> getAllCategory(){
        return repo.findAllCategory();
    }

    public List<CategoryListDTO> getCategoryTree() {
        List<Category> topLevelCategories = repo.findByParentIsNullAndStatus(1);
        return topLevelCategories.stream().map(this::convertToDto).toList();
    }

    private CategoryListDTO convertToDto(Category category) {
        List<CategoryListDTO> children = category.getChildren().stream()
                .filter(c -> c.getStatus() == 1)
                .map(this::convertToDto)
                .toList();

        return CategoryListDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .image(category.getImage())  // folder path
                .subcategories(children)
                .build();
    }

    public boolean checkNameExist(String name){
        return repo.existsByName(name);
    }

    public Category saveCategory(Category cate){
        return repo.save(cate);
    }

    public Category findByName(String name){
        return repo.findByName(name);
    }

    public Category getCategoryById(Long id) {
        return repo.findById(id).orElse(null);
    }

    public List<ProductHasCategory> getAllCategoryWithBrand(){
        return pcRepo.findAll();
    }

    @Transactional
    public Category updateCategory(Long id, String newName, Long parentId, MultipartFile imageFile) {
        Category category = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Category not found"));

        category.setName(newName);

        if (parentId != null) {
            Category parent = repo.findById(parentId).orElse(null);
            category.setParent(parent);
        }

        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                String filename = UUID.randomUUID() + "_" + imageFile.getOriginalFilename();
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                Path path = uploadPath.resolve(filename);
                Files.copy(imageFile.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
                category.setImage("/brand_and_category_image/" + filename);
            } catch (IOException e) {
                throw new RuntimeException("Category image upload failed.");
            }
        }

        return repo.save(category);
    }

    @Transactional
    public void softDeleteCategory(Long id) {
        Category category = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        category.setStatus(0);
        repo.save(category);
    }

    @Transactional
    public void addSubCategories(SubCategoryDTO dto) {
        Category parent = repo.findById(dto.getParentId())
                .orElseThrow(() -> new IllegalArgumentException("Parent category not found"));

        for (String subName : dto.getSubCategoryNames()) {
            if (subName == null || subName.trim().isEmpty()) continue;

            Category sub = repo.findByName(subName.trim());
            if (sub != null && (sub.getParent() == null || !sub.getParent().getId().equals(parent.getId()))) {
                sub.setParent(parent);
                repo.save(sub);  // just update the parent
            }
        }
    }

}
