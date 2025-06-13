package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Brand;
import com.Ojt.Ecommerce.entity.BrandHasCategory;
import com.Ojt.Ecommerce.entity.Category;
import com.Ojt.Ecommerce.repository.BrandHasCategoryRepository;
import com.Ojt.Ecommerce.repository.BrandRepository;
import com.Ojt.Ecommerce.repository.CategoryRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BrandHasCategoryService {

    @Autowired
    private BrandHasCategoryRepository repo;

    @Autowired
    private ModelMapper mapper;

    public BrandHasCategory saveBrandAndCat(BrandHasCategory bcObj){
        return repo.save(bcObj);
    }
}
