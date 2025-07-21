package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.BrandDTO;
import com.Ojt.Ecommerce.dto.BrandListDTO;
import com.Ojt.Ecommerce.entity.Brand;
import com.Ojt.Ecommerce.entity.BrandHasCategory;
import com.Ojt.Ecommerce.entity.Category;
import com.Ojt.Ecommerce.service.BrandHasCategoryService;
import com.Ojt.Ecommerce.service.BrandService;
import com.Ojt.Ecommerce.service.CategoryService;
import com.Ojt.Ecommerce.annotations.LogActivity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/brand")
public class BrandController {
    private final String IMAGE_FOLDER = "C:/Users/HP/OjtFinalProject/backend/Ecommerce/brand_and_category_image/";
    private final String IMAGE_PATH_DB_PREFIX = "/brand_and_category_image/";

    @Autowired
    private BrandService service;

    @Autowired
    private CategoryService cateService;

    @Autowired
    private BrandHasCategoryService bcService;

    @GetMapping("/getallbrand")
    public List<BrandListDTO> getAllBrand(){
        return service.getAllBrandsWithCategories();
    }

    @GetMapping("/getbycateid/{id}")
    public List<Brand> getByCategoryId(@PathVariable Long id){
        return service.getAllBrandByCateId(id);
    }

    @LogActivity(actionType = "CREATE", entityType = "BRAND", description = "Created brand", severityLevel = "MEDIUM")
    @PostMapping(value = "/addbrand", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> saveBrand(
            @RequestPart("brand") BrandDTO dto,
            @RequestPart(value = "image", required = false) MultipartFile imageFile
    ) {
        String folder = "C:/Users/HP/OjtFinalProject/backend/Ecommerce/brand_and_category_image/";
        String dbPrefix = "/brand_and_category_image/";

        if (service.checkNameExist(dto.getBrandName())) {
            return ResponseEntity.badRequest().body("Brand already exists.");
        }

        Brand brand = new Brand();
        brand.setName(dto.getBrandName());

        // Save image (optional)
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                String filename = UUID.randomUUID() + "_" + imageFile.getOriginalFilename();
                Path path = Paths.get(folder + filename);
                Files.createDirectories(path.getParent());
                Files.copy(imageFile.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
                brand.setImage(dbPrefix + filename);
            } catch (IOException e) {
                return ResponseEntity.internalServerError().body("Brand image upload failed.");
            }
        }

        Brand savedBrand = service.saveBrand(brand);

        if (dto.getCategoryName() != null && !dto.getCategoryName().isBlank()) {
            if (cateService.checkNameExist(dto.getCategoryName())) {
                return ResponseEntity.badRequest().body("Category already exists. Please select it.");
            }

            Category category = new Category();
            category.setName(dto.getCategoryName());
            Category savedCategory = cateService.saveCategory(category);

            BrandHasCategory bc = new BrandHasCategory();
            bc.setBrand(savedBrand);
            bc.setCategory(savedCategory);
            bcService.saveBrandAndCat(bc);
        }

        if (dto.getCategoryIds() != null) {
            for (Long catId : dto.getCategoryIds()) {
                Category cat = new Category();
                cat.setId(catId);
                BrandHasCategory bc = new BrandHasCategory();
                bc.setBrand(savedBrand);
                bc.setCategory(cat);
                bcService.saveBrandAndCat(bc);
            }
        }
        return ResponseEntity.ok("Brand created successfully.");
    }

    @LogActivity(actionType = "UPDATE", entityType = "BRAND", description = "Updated brand", severityLevel = "MEDIUM", entityIdParam = "id", logChanges = true)
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateBrand(@PathVariable Long id,
                                         @RequestPart("brand") BrandDTO dto,
                                         @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        try {
            Brand existing = service.getBrandById(id);
            if (existing == null) {
                return ResponseEntity.notFound().build();
            }

            existing.setName(dto.getBrandName());

            // ✅ Update image if provided
            if (imageFile != null && !imageFile.isEmpty()) {
                String filename = UUID.randomUUID() + "_" + imageFile.getOriginalFilename();
                Path path = Paths.get(IMAGE_FOLDER + filename);
                Files.createDirectories(path.getParent());
                Files.copy(imageFile.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
                existing.setImage("/images/" + filename);
            }

            Brand updated = service.saveBrand(existing);

            // ✅ Replace category mapping
            bcService.deleteByBrandId(id); // delete old mappings
            if (dto.getCategoryIds() != null) {
                for (Long catId : dto.getCategoryIds()) {
                    BrandHasCategory map = new BrandHasCategory();
                    map.setBrand(updated);
                    Category cat = new Category();
                    cat.setId(catId);
                    map.setCategory(cat);
                    bcService.saveBrandAndCat(map);
                }
            }

            return ResponseEntity.ok("Updated successfully");

        } catch (Exception e) {
            e.printStackTrace(); // Log the full stack trace
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Update failed: " + e.getMessage());
        }
    }

    @LogActivity(actionType = "DELETE", entityType = "BRAND", description = "Deleted brand", severityLevel = "HIGH", entityIdParam = "id")
    @PutMapping("/delete/{id}")
    public ResponseEntity<?> deleteBrand(@PathVariable Long id) {
        Brand existing = service.getBrandById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        existing.setStatus(0);
        service.saveBrand(existing);
        return ResponseEntity.ok("success");
    }

    @GetMapping("/getbrandbyid/{id}")
    public ResponseEntity<BrandDTO> getBrandById(@PathVariable Long id) {
        Brand brand = service.getBrandById(id);
        if (brand == null || brand.getStatus() == 0) {
            return ResponseEntity.notFound().build();
        }

        BrandDTO dto = new BrandDTO();
        dto.setId(brand.getId());
        dto.setBrandName(brand.getName());
        dto.setImage(brand.getImage());

        // Collect category IDs
        if (brand.getBrandCategories() != null) {
            List<Long> categoryIds = brand.getBrandCategories().stream()
                    .map(bc -> bc.getCategory().getId())
                    .toList();
            dto.setCategoryIds(categoryIds);
        }

        return ResponseEntity.ok(dto);
    }
    //add for link brand with category by pmk july 7
    @PostMapping("/linkwithcategory")
    public ResponseEntity<?> linkBrandWithCategory(@RequestParam Long brandId, @RequestParam Long categoryId) {
        try {
            BrandHasCategory bc = new BrandHasCategory();
            Brand brand = service.getBrandById(brandId);
            Category category = cateService.getCategoryById(categoryId);

            if (brand == null || category == null) {
                return ResponseEntity.badRequest().body("Brand or Category not found");
            }

            bc.setBrand(brand);
            bc.setCategory(category);

            BrandHasCategory savedBc = bcService.saveBrandAndCat(bc);
            return ResponseEntity.ok(savedBc);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to link brand with category: " + e.getMessage());
        }
    }

    //add for fetch data for discount by pmk july 7
    @GetMapping("/brandcategories")
    public ResponseEntity<List<BrandHasCategory>> getAllBrandCategories() {
        try {
            List<BrandHasCategory> brandCategories = bcService.getAllBrandCategories();
            return ResponseEntity.ok(brandCategories);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
