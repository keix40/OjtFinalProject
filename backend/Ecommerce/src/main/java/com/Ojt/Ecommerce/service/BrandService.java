package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Brand;
import com.Ojt.Ecommerce.repository.BrandHasCategoryRepository;
import com.Ojt.Ecommerce.repository.BrandRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BrandService {
    @Autowired
    private BrandRepository repo;

    @Autowired
    private ModelMapper mapper;

    public List<Brand> getAllBrand(){
        return repo.findAll();
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
}
