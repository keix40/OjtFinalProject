package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.DeliveryMethod;
import com.Ojt.Ecommerce.repository.DeliveryMethodRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliveryService {
    @Autowired
    private ModelMapper mapper;

    @Autowired
    private DeliveryMethodRepository repo;

    public List<DeliveryMethod> findAllDelivery(){
        return repo.findAll();
    }
}
