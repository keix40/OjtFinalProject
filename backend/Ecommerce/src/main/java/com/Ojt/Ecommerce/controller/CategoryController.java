package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.BrandDTO;
import com.Ojt.Ecommerce.dto.CategoryDTO;
import com.Ojt.Ecommerce.entity.Brand;
import com.Ojt.Ecommerce.entity.BrandHasCategory;
import com.Ojt.Ecommerce.entity.Category;
import com.Ojt.Ecommerce.entity.ProductHasCategory;
import com.Ojt.Ecommerce.service.BrandHasCategoryService;
import com.Ojt.Ecommerce.service.BrandService;
import com.Ojt.Ecommerce.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/category")
public class CategoryController {

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

    @PostMapping("/addcategory")
    public ResponseEntity<?> saveBrand(@RequestBody CategoryDTO dto) {
        Brand brand = null;

        if (dto.getBrandId() != null && dto.getBrandId() != 0) {
            brand = new Brand();
            brand.setId(dto.getBrandId());
        }
        else if (dto.getBrandName() != null && !dto.getBrandName().trim().isEmpty()) {
            boolean brandExist = brandService.checkNameExist(dto.getBrandName().trim());
            if (brandExist) {
                return ResponseEntity.badRequest().body("Brand already exists. Please select it.");
            }

            Brand newBrand = new Brand();
            newBrand.setName(dto.getBrandName().trim());
            brand = brandService.saveBrand(newBrand);

            if (brand == null) {
                return ResponseEntity.badRequest().body("Brand Register Failed.");
            }
        }

        Category parentCategory = null;
        if (dto.getParentId() != null) {
            parentCategory = service.getCategoryById(dto.getParentId());
            if (parentCategory == null) {
                return ResponseEntity.badRequest().body("Parent category not found.");
            }
        }

        for (String cateName : dto.getCateNames()) {
            if (cateName == null || cateName.trim().isEmpty()) continue;

            Category category = service.findByName(cateName.trim());
            if (category == null) {
                Category newCate = new Category();
                newCate.setName(cateName.trim());
                if (parentCategory != null) {
                    newCate.setParent(parentCategory);
                }

                category = service.saveCategory(newCate);
                if (category == null) {
                    return ResponseEntity.badRequest().body("Category Register Failed for: " + cateName);
                }
            }

            if (brand != null) {
                BrandHasCategory bcObj = new BrandHasCategory();
                bcObj.setBrand(brand);
                bcObj.setCategory(category);

                BrandHasCategory savedBc = bcService.saveBrandAndCat(bcObj);
                if (savedBc == null) {
                    return ResponseEntity.badRequest().body("Failed to link brand with category: " + cateName);
                }
            }
        }

        return ResponseEntity.ok("Success");
    }

    @GetMapping("/getallcatewithbrand")
    public List<ProductHasCategory> getAllCategoryWithBrand(){
        return service.getAllCategoryWithBrand();
    }
}
