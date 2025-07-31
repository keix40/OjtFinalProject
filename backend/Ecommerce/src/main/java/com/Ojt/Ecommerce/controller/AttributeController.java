package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.AttributeAndValueDTO;
import com.Ojt.Ecommerce.dto.AttributeValueDTO;
import com.Ojt.Ecommerce.entity.Attribute;
import com.Ojt.Ecommerce.entity.AttributeValue;
import com.Ojt.Ecommerce.service.AttributeService;
import com.Ojt.Ecommerce.service.AttributeValueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.Ojt.Ecommerce.annotations.LogActivity;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/attribute")
public class AttributeController {

    @Autowired
    private AttributeService attService;

    @Autowired
    private AttributeValueService avService;

    @Autowired
    private com.Ojt.Ecommerce.repository.AttributeRepository attributeRepository;

    @GetMapping("/getallattribute")
    public List<Attribute> getAllAttribute(){
        return attService.getAllAttribute();
    }

    @GetMapping("/getallvalue")
    public List<AttributeValue> getAllValue(){
        return avService.getAllAttributeValue();
    }

//    @GetMapping("/getvaluebyid/{id}")
//    public List<AttributeValue> getValueByAttributeValue(@PathVariable Long id){
//        return avService.findAvByAttributeId(id);
//    }

//    @GetMapping("/getvaluebyid/{id}")
//    public List<AttributeAndValueDTO> getValueByAttributeValue(@PathVariable Long id) {
//        return attService.getAttributeWithValues(id);
//    }

    @GetMapping("/getvaluebyid/{id}")
    public ResponseEntity<?> getValueByAttributeValue(@PathVariable Long id) {
        try {
            List<AttributeAndValueDTO> result = attService.getAttributeWithValues(id);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    @LogActivity(actionType = "CREATE", entityType = "ATTRIBUTE", description = "Created attribute", severityLevel = "MEDIUM")
    @PostMapping("/create")
    public ResponseEntity<?> saveAttributeAndValue(@RequestBody AttributeAndValueDTO dto) {
        Attribute attribute;

        if (dto.getAttributeId() != null) {
            attribute = attService.getAttributeById(dto.getAttributeId());
            if (attribute == null) {
                return ResponseEntity.badRequest().body("Invalid attribute ID.");
            }
            // Update attribute name if changed
            if (dto.getAttributeName() != null && !dto.getAttributeName().equals(attribute.getName())) {
                attService.updateAttribute(attribute.getId(), dto.getAttributeName());
                attribute.setName(dto.getAttributeName()); // update local object for further use
            }
            // 1. Get all existing values for this attribute
            List<AttributeValue> existingValues = avService.findAvByAttributeId(attribute.getId());
            // 2. Build a map of incoming values by id (for update and comparison)
            Map<Long, String> incomingIdToValue = dto.getValues().stream()
                .filter(v -> v.getId() != null)
                .collect(java.util.stream.Collectors.toMap(AttributeValueDTO::getId, AttributeValueDTO::getValue));
            // 3. Soft delete any existing value not present in the update
            for (AttributeValue existing : existingValues) {
                if (existing.getStatus() == null || existing.getStatus() == 1) {
                    if (existing.getId() != null && !incomingIdToValue.containsKey(existing.getId())) {
                        avService.softDeleteAttributeValue(existing.getId());
                    }
                }
            }
            // 4. Update values that exist in both
            for (AttributeValue existing : existingValues) {
                if (existing.getStatus() == null || existing.getStatus() == 1) {
                    if (existing.getId() != null && incomingIdToValue.containsKey(existing.getId())) {
                        String newValue = incomingIdToValue.get(existing.getId());
                        if (!existing.getValue().equals(newValue)) {
                            avService.updateAttributeValue(existing.getId(), newValue);
                        }
                    }
                }
            }
            // 5. Insert new values (those in update with no id)
            for (AttributeValueDTO valueDTO : dto.getValues()) {
                if (valueDTO.getId() == null) {
                    boolean valueExist = avService.checkExists(valueDTO.getValue(), attribute.getId());
                    if (!valueExist) {
                        AttributeValue av = new AttributeValue();
                        av.setValue(valueDTO.getValue());
                        av.setAttribute(attribute);
                        if (avService.saveAttributeValue(av) == null) {
                            return ResponseEntity.badRequest().body("Failed to save value: " + valueDTO.getValue());
                        }
                    }
                }
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
            // Insert all new values for new attribute
            for (AttributeValueDTO valueDTO : dto.getValues()) {
                AttributeValue av = new AttributeValue();
                av.setValue(valueDTO.getValue());
                av.setAttribute(attribute);
                if (avService.saveAttributeValue(av) == null) {
                    return ResponseEntity.badRequest().body("Failed to save value: " + valueDTO.getValue());
                }
            }
        } else {
            return ResponseEntity.badRequest().body("Either attributeId or attributeName must be provided.");
        }
        return ResponseEntity.ok("All values processed successfully.");
    }

    @PostMapping("/addvalue")
    public ResponseEntity<?> addValueToAttribute(@RequestParam Long attributeId, @RequestBody AttributeValueDTO dto) {
        Attribute attribute = attService.getAttributeById(attributeId);
        if (attribute == null) {
            return ResponseEntity.badRequest().body("Attribute not found");
        }

        if (avService.checkExists(dto.getValue(), attributeId)) {
            return ResponseEntity.badRequest().body("Value already exists");
        }

        AttributeValue value = new AttributeValue();
        value.setValue(dto.getValue());
        value.setAttribute(attribute);

        avService.saveAttributeValue(value);
        return ResponseEntity.ok("Value added");
    }

    @LogActivity(actionType = "UPDATE", entityType = "ATTRIBUTE", description = "Updated attribute", severityLevel = "MEDIUM", entityIdParam = "id", logChanges = true)
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateAttribute(@PathVariable Long id, @RequestBody Attribute dto) {
        try {
            attService.updateAttribute(id, dto.getName());
            // Return the actual entity for logging
            Attribute updatedAttribute = attributeRepository.findById(id).orElse(null);
            return ResponseEntity.ok(updatedAttribute);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update attribute");
        }
    }

    @LogActivity(actionType = "DELETE", entityType = "ATTRIBUTE", description = "Deleted attribute", severityLevel = "HIGH", entityIdParam = "id")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> softDeleteAttribute(@PathVariable Long id) {
        try {
            attService.softDeleteAttribute(id);
            return ResponseEntity.ok("Attribute soft deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to soft delete attribute");
        }
    }

    @PutMapping("/update-value/{id}")
    public ResponseEntity<?> updateAttributeValue(@PathVariable Long id, @RequestBody AttributeValue dto) {
        try {
            avService.updateAttributeValue(id, dto.getValue());
            return ResponseEntity.ok("Attribute value updated successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update attribute value");
        }
    }

    @DeleteMapping("/delete-value/{id}")
    public ResponseEntity<?> softDeleteAttributeValue(@PathVariable Long id) {
        try {
            avService.softDeleteAttributeValue(id);
            return ResponseEntity.ok("Attribute value soft deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to soft delete attribute value");
        }
    }
}
