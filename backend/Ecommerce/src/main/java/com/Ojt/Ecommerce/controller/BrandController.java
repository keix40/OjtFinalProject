package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.BrandDTO;
import com.Ojt.Ecommerce.entity.Brand;
import com.Ojt.Ecommerce.entity.BrandHasCategory;
import com.Ojt.Ecommerce.entity.Category;
import com.Ojt.Ecommerce.service.BrandHasCategoryService;
import com.Ojt.Ecommerce.service.BrandService;
import com.Ojt.Ecommerce.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/brand")
public class BrandController {
    @Autowired
    private BrandService service;

    @Autowired
    private CategoryService cateService;

    @Autowired
    private BrandHasCategoryService bcService;

    @GetMapping("/getallbrand")
    public List<Brand> getAllBrand(){
        return service.getAllBrand();
    }

    @GetMapping("/getbycateid/{id}")
    public List<Brand> getByCategoryId(@PathVariable Long id){
        return service.getAllBrandByCateId(id);
    }

    @PostMapping("/addbrand")
    public ResponseEntity<?> saveBrand(@RequestBody BrandDTO dto) {
        // Check if brand exists
        if (service.checkNameExist(dto.getBrandName())) {
            return ResponseEntity.badRequest().body("Brand already exists.");
        }

        Brand brand = new Brand();
        brand.setName(dto.getBrandName());
        Brand savedBrand = service.saveBrand(brand);

        if (savedBrand == null) {
            return ResponseEntity.badRequest().body("Brand registration failed.");
        }

        if (dto.getCategoryName() != null && !dto.getCategoryName().isBlank()) {
            boolean cateExist = cateService.checkNameExist(dto.getCategoryName());
            if (cateExist) {
                return ResponseEntity.badRequest().body("Category already exists, please select it.");
            }

            Category newCategory = new Category();
            newCategory.setName(dto.getCategoryName());
            Category savedCategory = cateService.saveCategory(newCategory);

            BrandHasCategory bc = new BrandHasCategory();
            bc.setBrand(savedBrand);
            bc.setCategory(savedCategory);
            bcService.saveBrandAndCat(bc);
        }

        if (dto.getCategoryIds() != null && !dto.getCategoryIds().isEmpty()) {
            for (Long categoryId : dto.getCategoryIds()) {
                Category existingCategory = new Category();
                existingCategory.setId(categoryId);

                BrandHasCategory bc = new BrandHasCategory();
                bc.setBrand(savedBrand);
                bc.setCategory(existingCategory);
                bcService.saveBrandAndCat(bc);
            }
        }
        return ResponseEntity.ok("Success");
    }


}
