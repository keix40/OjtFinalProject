package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Attribute;
import com.Ojt.Ecommerce.entity.AttributeValue;
import com.Ojt.Ecommerce.repository.AttributeValueRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AttributeValueService {
    @Autowired
    private AttributeValueRepository repo;

    @Autowired
    private ModelMapper mapper;

    public List<AttributeValue> findAvByAttributeId(Long id){
        return repo.findByAttributeId(id);
    }

    public List<AttributeValue> getAllAttributeValue(){
        return repo.findAll();
    }

    public boolean checkExists(String value, Long attributeId){
        return repo.existsByValueAndAttributeId(value, attributeId);
    }

    public AttributeValue saveAttributeValue(AttributeValue acObj){
        return repo.save(acObj);
    }
}
