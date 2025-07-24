package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Attribute;
import com.Ojt.Ecommerce.entity.AttributeValue;
import com.Ojt.Ecommerce.repository.AttributeValueRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AttributeValueService {
    @Autowired
    private AttributeValueRepository repo;

    @Autowired
    private ModelMapper mapper;

    public List<AttributeValue> findAvByAttributeId(Long id){
        return repo.findActiveByAttribute_Id(id);
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

    @Transactional
    public void softDeleteAttributeValue(Long id) {
        repo.softDeleteById(id);
    }

    @Transactional
    public void updateAttributeValue(Long id, String value) {
        repo.updateValueById(id, value);
    }
}
