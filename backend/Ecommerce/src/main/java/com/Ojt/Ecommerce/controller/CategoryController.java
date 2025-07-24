package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.BrandDTO;
import com.Ojt.Ecommerce.dto.CategoryDTO;
import com.Ojt.Ecommerce.dto.CategoryListDTO;
import com.Ojt.Ecommerce.dto.SubCategoryDTO;
import com.Ojt.Ecommerce.entity.Brand;
import com.Ojt.Ecommerce.entity.BrandHasCategory;
import com.Ojt.Ecommerce.entity.Category;
import com.Ojt.Ecommerce.entity.ProductHasCategory;
import com.Ojt.Ecommerce.service.BrandHasCategoryService;
import com.Ojt.Ecommerce.service.BrandService;
import com.Ojt.Ecommerce.service.CategoryService;
import com.Ojt.Ecommerce.annotations.LogActivity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/category")
public class CategoryController {
    private static final Path uploadPath = Paths.get("brand_and_category_image").toAbsolutePath();
    private final String IMAGE_PATH_DB_PREFIX = "/brand_and_category_image/";

    @Autowired
    private CategoryService service;

    @Autowired
    private BrandService brandService;

    @Autowired
    private BrandHasCategoryService bcService;

    @GetMapping("/getallcategory")
    public List<Category> getAllCategory(){
        return service.getAllCategory();
    }

    @GetMapping("/tree")
    public ResponseEntity<List<CategoryListDTO>> getCategoryTree() {
        return ResponseEntity.ok(service.getCategoryTree());
    }

    @LogActivity(actionType = "CREATE", entityType = "CATEGORY", description = "Created category", severityLevel = "MEDIUM")
    @PostMapping(value = "/addcategory", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> saveCategory(
            @RequestPart("category") CategoryDTO dto,
            @RequestPart(value = "image", required = false) MultipartFile imageFile
    ) {
        Brand brand = null;

        if (dto.getBrandId() != null && dto.getBrandId() != 0) {
            brand = new Brand();
            brand.setId(dto.getBrandId());
        } else if (dto.getBrandName() != null && !dto.getBrandName().trim().isEmpty()) {
            if (brandService.checkNameExist(dto.getBrandName().trim())) {
                return ResponseEntity.badRequest().body("Brand already exists.");
            }

            Brand newBrand = new Brand();
            newBrand.setName(dto.getBrandName().trim());

            // Save image (optional)
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    String filename = UUID.randomUUID() + "_" + imageFile.getOriginalFilename();
                    if (!Files.exists(uploadPath)) {
                        Files.createDirectories(uploadPath);
                    }
                    Path path = uploadPath.resolve(filename);
                    Files.copy(imageFile.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
                    newBrand.setImage(IMAGE_PATH_DB_PREFIX + filename);
                } catch (IOException e) {
                    return ResponseEntity.internalServerError().body("Brand image upload failed.");
                }
            }

            brand = brandService.saveBrand(newBrand);
        }

        Category parent = null;
        if (dto.getParentId() != null) {
            parent = service.getCategoryById(dto.getParentId());
            if (parent == null) {
                return ResponseEntity.badRequest().body("Parent category not found.");
            }
        }

        for (String cateName : dto.getCateNames()) {
            if (cateName == null || cateName.trim().isEmpty()) continue;

            Category category = service.findByName(cateName.trim());
            if (category == null) {
                Category newCate = new Category();
                newCate.setName(cateName.trim());
                newCate.setParent(parent);

                if (imageFile != null && !imageFile.isEmpty()) {
                    try {
                        String filename = UUID.randomUUID() + "_" + imageFile.getOriginalFilename();
                        if (!Files.exists(uploadPath)) {
                            Files.createDirectories(uploadPath);
                        }
                        Path path = uploadPath.resolve(filename);
                        Files.copy(imageFile.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
                        newCate.setImage(IMAGE_PATH_DB_PREFIX + filename);
                    } catch (IOException e) {
                        return ResponseEntity.internalServerError().body("Category image upload failed.");
                    }
                }

                category = service.saveCategory(newCate);
            }

            if (brand != null) {
                BrandHasCategory bc = new BrandHasCategory();
                bc.setBrand(brand);
                bc.setCategory(category);
                bcService.saveBrandAndCat(bc);
            }
        }

        return ResponseEntity.ok("Category created successfully.");
    }

    @GetMapping("/getallcatewithbrand")
    public List<ProductHasCategory> getAllCategoryWithBrand(){
        return service.getAllCategoryWithBrand();
    }

    @LogActivity(actionType = "UPDATE", entityType = "CATEGORY", description = "Updated category", severityLevel = "MEDIUM", entityIdParam = "id", logChanges = true)
    @PutMapping(value = "/update/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateCategory(
            @PathVariable Long id,
            @RequestPart("name") String name,
            @RequestPart(value = "parentId", required = false) Long parentId,
            @RequestPart(value = "image", required = false) MultipartFile imageFile
    ) {
        try {
            Category updated = service.updateCategory(id, name, parentId, imageFile);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @LogActivity(actionType = "DELETE", entityType = "CATEGORY", description = "Deleted category", severityLevel = "HIGH", entityIdParam = "id")
    @PutMapping("/delete/{id}")
    public ResponseEntity<?> softDeleteCategory(@PathVariable Long id) {
        try {
            service.softDeleteCategory(id);
            return ResponseEntity.ok("Category soft-deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/addsubcategories")
    public ResponseEntity<?> addSubCategories(@RequestBody SubCategoryDTO dto) {
        try {
            service.addSubCategories(dto);
            return ResponseEntity.ok("Subcategories added successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}
