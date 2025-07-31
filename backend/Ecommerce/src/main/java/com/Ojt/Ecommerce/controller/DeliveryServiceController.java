package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.DeliveryServiceDTO;
import com.Ojt.Ecommerce.service.DeliveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import static com.Ojt.Ecommerce.constants.PermissionConstants.*;
import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;
import com.Ojt.Ecommerce.annotations.LogActivity;
import com.Ojt.Ecommerce.annotations.RequiresPermission;

@PermissionCategoryTag(value = "delivery", name = "Delivery Service Management", icon = "fa-truck")
@RestController
@RequestMapping("/deliveryservice")
@RequiredArgsConstructor
public class DeliveryServiceController {
    private final DeliveryService deliveryService;

    @Autowired
    private com.Ojt.Ecommerce.repository.DeliveryServiceRepository deliveryServiceRepository;

    @GetMapping
    @RequiresPermission(value = DELIVERY_VIEW, level = "basic")
    public List<DeliveryServiceDTO> getAll() {
        return deliveryService.getAll();
    }

    @GetMapping("/{id}")
    public DeliveryServiceDTO getById(@PathVariable Long id) {
        return deliveryService.getById(id); // Now returns DTO
    }

    @LogActivity(actionType = "CREATE", entityType = "DELIVERY_SERVICE", description = "Created delivery service", severityLevel = "MEDIUM")
    @PostMapping
    @RequiresPermission(value = DELIVERY_CREATE, level = "advanced")
    public DeliveryServiceDTO create(@RequestBody DeliveryServiceDTO deliveryServices) {
        return deliveryService.create(deliveryServices); // Accept DTO, return DTO
    }


    @LogActivity(actionType = "UPDATE", entityType = "DELIVERY_SERVICE", description = "Updated delivery service", severityLevel = "MEDIUM", entityIdParam = "id", logChanges = true)
    @PutMapping("/{id}")
    @RequiresPermission(value = DELIVERY_UPDATE, level = "advanced")
    public DeliveryServiceDTO update(@PathVariable Long id, @RequestBody DeliveryServiceDTO deliveryServices) {
        return deliveryService.update(id, deliveryServices);
    }

    @LogActivity(actionType = "DELETE", entityType = "DELIVERY_SERVICE", description = "Deleted delivery service", severityLevel = "HIGH", entityIdParam = "id")
    @DeleteMapping("/{id}")
    @RequiresPermission(value = DELIVERY_DELETE, level = "critical")
    public ResponseEntity<String> softDelete(@PathVariable Long id) {
        deliveryService.softDelete(id);
        return ResponseEntity.ok("Delivery service soft deleted successfully.");
    }
}
