package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Attribute;
import com.Ojt.Ecommerce.repository.AttributeRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AttributeService {
    @Autowired
    private AttributeRepository repo;

    @Autowired
    private ModelMapper mapper;

    public List<Attribute> getAllAttribute(){
        return repo.findAll();
    }

    public Attribute getAttributeById(Long id){
        return repo.findById(id).orElse(null);
    }

    public boolean checkExist(String name){
        return repo.existsByName(name);
    }

    public Attribute saveAttribute(Attribute attribute){
        return repo.save(attribute);
    }
}
