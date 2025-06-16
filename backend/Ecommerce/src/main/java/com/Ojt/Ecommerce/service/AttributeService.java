package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.AttributeAndValueDTO;
import com.Ojt.Ecommerce.dto.AttributeValueDTO;
import com.Ojt.Ecommerce.entity.Attribute;
import com.Ojt.Ecommerce.entity.AttributeValue;
import com.Ojt.Ecommerce.repository.AttributeRepository;
import com.Ojt.Ecommerce.repository.AttributeValueRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AttributeService {
    @Autowired
    private AttributeRepository repo;

    @Autowired
    private AttributeValueRepository avRepo;

    @Autowired
    private ModelMapper mapper;

    public List<Attribute> getAllAttribute(){
        return repo.findAll();
    }

    public Attribute getAttributeById(Long id){
        return repo.findById(id).orElse(null);
    }

    public List<AttributeAndValueDTO> getAttributeWithValues(Long attributeId) {
        Optional<Attribute> attributeOpt = repo.findById(attributeId);

        if (attributeOpt.isEmpty()) {
            throw new RuntimeException("Attribute not found with id: " + attributeId);
        }

        Attribute attribute = attributeOpt.get();
        List<AttributeValue> values = avRepo.findByAttribute_Id(attributeId);

        if (values == null) {
            values = new ArrayList<>();
        }



        AttributeAndValueDTO dto = new AttributeAndValueDTO();
        dto.setAttributeId(attribute.getId());
        dto.setAttributeName(attribute.getName());
        List<AttributeValueDTO> valueDTOs = values.stream().map(val -> {
            AttributeValueDTO dtoVal = new AttributeValueDTO();
            dtoVal.setId(val.getId());
            dtoVal.setValue(val.getValue());
            return dtoVal;
        }).toList();
        dto.setValues(valueDTOs);

        return List.of(dto);
    }


    public boolean checkExist(String name){
        return repo.existsByName(name);
    }

    public Attribute saveAttribute(Attribute attribute){
        return repo.save(attribute);
    }
}
