package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.BrandListDTO;
import com.Ojt.Ecommerce.dto.CategoryListDTO;
import com.Ojt.Ecommerce.entity.Brand;
import com.Ojt.Ecommerce.entity.BrandHasCategory;
import com.Ojt.Ecommerce.entity.Category;
import com.Ojt.Ecommerce.repository.BrandHasCategoryRepository;
import com.Ojt.Ecommerce.repository.BrandRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BrandService {
    @Autowired
    private BrandRepository repo;

    @Autowired
    private ModelMapper mapper;

    public List<Brand> getAllBrand(){
        return repo.findAllBrand();
    }

    public List<BrandListDTO> getAllBrandsWithCategories() {
        List<Brand> brands = repo.findAllBrand();

        return brands.stream().map(brand -> {
            List<BrandHasCategory> brandCategories = brand.getBrandCategories();

            // Get Unique Categories (avoid duplication)
            Set<Category> categorySet = brandCategories.stream()
                    .map(BrandHasCategory::getCategory)
                    .collect(Collectors.toSet());

            List<CategoryListDTO> categoryDTOs = categorySet.stream()
                    .map(this::mapCategoryToDTORecursive)
                    .collect(Collectors.toList());

            return BrandListDTO.builder()
                    .id(brand.getId())
                    .name(brand.getName())
                    .image(brand.getImage())
                    .categories(categoryDTOs)
                    .build();

        }).collect(Collectors.toList());
    }

    private CategoryListDTO mapCategoryToDTORecursive(Category category) {
        List<CategoryListDTO> subcategories = category.getChildren() != null
                ? category.getChildren().stream()
                .map(this::mapCategoryToDTORecursive)
                .collect(Collectors.toList())
                : new ArrayList<>();

        return CategoryListDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .image(category.getImage())
                .subcategories(subcategories)
                .build();
    }

    public List<Brand> getAllBrandByCateId(Long id){
        return repo.findAllBrandByCateId(id);
    }

    public boolean checkNameExist(String name){
        return repo.existsByName(name);
    }

    public Brand saveBrand(Brand brand){
        return repo.save(brand);
    }

    //add for link brand with category by pmk july 7
    public Brand getBrandById(Long id) {
        Optional<Brand> brand = repo.findById(id);
        return brand.orElse(null);
    }

    public Brand getBrandById(Long id) {
        return repo.findById(id).orElse(null);
    }

}
