package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.AttributeAndValueDTO;
import com.Ojt.Ecommerce.entity.Attribute;
import com.Ojt.Ecommerce.entity.AttributeValue;
import com.Ojt.Ecommerce.service.AttributeService;
import com.Ojt.Ecommerce.service.AttributeValueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/attribute")
public class AttributeController {

    @Autowired
    private AttributeService attService;

    @Autowired
    private AttributeValueService avService;

    @GetMapping("/getallattribute")
    public List<Attribute> getAllAttribute(){
        return attService.getAllAttribute();
    }

    @GetMapping("/getallvalue")
    public List<AttributeValue> getAllValue(){
        return avService.getAllAttributeValue();
    }

    @GetMapping("/getvaluebyid/{id}")
    public List<AttributeValue> getValueByAttributeValue(@PathVariable Long id){
        return avService.findAvByAttributeId(id);
    }

    @PostMapping("/create")
    public ResponseEntity<?> saveAttributeAndValue(@RequestBody AttributeAndValueDTO dto) {
        Attribute attribute;

        if (dto.getAttributeId() != null) {
            attribute = attService.getAttributeById(dto.getAttributeId());
            if (attribute == null) {
                return ResponseEntity.badRequest().body("Invalid attribute ID.");
            }
        } else if (dto.getAttributeName() != null && !dto.getAttributeName().isEmpty()) {
            boolean exists = attService.checkExist(dto.getAttributeName());
            if (exists) {
                return ResponseEntity.badRequest().body("Attribute name already exists.");
            }
            attribute = new Attribute();
            attribute.setName(dto.getAttributeName());
            attribute = attService.saveAttribute(attribute);
            if (attribute == null) {
                return ResponseEntity.badRequest().body("Failed to save new attribute.");
            }
        } else {
            return ResponseEntity.badRequest().body("Either attributeId or attributeName must be provided.");
        }
        List<String> errors = new ArrayList<>();
        for (String value : dto.getValues()) {
            boolean valueExist = avService.checkExists(value, attribute.getId());
            if (!valueExist) {
                AttributeValue av = new AttributeValue();
                av.setValue(value);
                av.setAttribute(attribute);
                if (avService.saveAttributeValue(av) == null) {
                    errors.add("Failed to save value: " + value);
                }
            } else {
                errors.add("Value already exists: " + value);
            }
        }

        if (errors.isEmpty()) {
            return ResponseEntity.ok("All values saved successfully.");
        } else {
            return ResponseEntity.badRequest().body("Some values failed: " + errors);
        }
    }
}
