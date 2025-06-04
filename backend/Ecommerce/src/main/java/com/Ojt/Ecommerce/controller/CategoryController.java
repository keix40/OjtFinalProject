package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.BrandDTO;
import com.Ojt.Ecommerce.dto.CategoryDTO;
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
        BrandHasCategory bcObj = new BrandHasCategory();

        Brand brand;
        if (dto.getBrandId() != null) {
            brand = new Brand();
            brand.setId(dto.getBrandId()); // Use existing brand
        } else {
            boolean brandExist = brandService.checkNameExist(dto.getBrandName());
            if (brandExist) {
                return ResponseEntity.badRequest().body("Brand already exists. Please select it.");
            }

            Brand newBrand = new Brand();
            newBrand.setName(dto.getBrandName());
            brand = brandService.saveBrand(newBrand);
            if (brand == null) {
                return ResponseEntity.badRequest().body("Brand Register Failed.");
            }
        }
        bcObj.setBrand(brand);

        Category category = service.findByName(dto.getCateName());
        if (category == null) {
            // create new category if not exist
            Category newCate = new Category();
            newCate.setName(dto.getCateName());
            category = service.saveCategory(newCate);
            if (category == null) {
                return ResponseEntity.badRequest().body("Category Register Failed.");
            }
        }

        bcObj.setCategory(category);

        BrandHasCategory savedBc = bcService.saveBrandAndCat(bcObj);
        if (savedBc == null) {
            return ResponseEntity.badRequest().body("BrandHasCategory Register Failed.");
        }

        return ResponseEntity.ok("Success");
    }

}
