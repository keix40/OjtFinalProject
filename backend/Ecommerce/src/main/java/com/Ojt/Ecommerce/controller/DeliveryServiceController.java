package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.DeliveryServiceDTO;
import com.Ojt.Ecommerce.service.DeliveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/deliveryservice")
@RequiredArgsConstructor
public class DeliveryServiceController {
    private final DeliveryService deliveryService;

    @GetMapping
    public List<DeliveryServiceDTO> getAll() {
        return deliveryService.getAll();
    }

    @GetMapping("/{id}")
    public DeliveryServiceDTO getById(@PathVariable Long id) {
        return deliveryService.getById(id); // Now returns DTO
    }

    @PostMapping
    public DeliveryServiceDTO create(@RequestBody DeliveryServiceDTO deliveryServices) {
        return deliveryService.create(deliveryServices); // Accept DTO, return DTO
    }


    @PutMapping("/{id}")
    public DeliveryServiceDTO update(@PathVariable Long id, @RequestBody DeliveryServiceDTO deliveryServices) {
        return deliveryService.update(id, deliveryServices);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> softDelete(@PathVariable Long id) {
        deliveryService.softDelete(id);
        return ResponseEntity.ok("Delivery service soft deleted successfully.");
    }
}
