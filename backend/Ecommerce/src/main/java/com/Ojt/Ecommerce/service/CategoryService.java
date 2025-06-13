package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Category;
import com.Ojt.Ecommerce.repository.CategoryRepository;
import org.hibernate.dialect.unique.CreateTableUniqueDelegate;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository repo;

    @Autowired
    private ModelMapper mapper;

    public List<Category> getAllCategory(){
        return repo.findAll();
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
}
