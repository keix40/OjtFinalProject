package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.PolicyRequestDTO;
import com.Ojt.Ecommerce.dto.PolicyResponseDTO;
import com.Ojt.Ecommerce.service.PolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.Ojt.Ecommerce.annotations.LogActivity;

import java.util.List;

@RestController
@RequestMapping("/api/policies")
@RequiredArgsConstructor
public class PolicyController {

    private final PolicyService policyService;

    @Autowired
    private com.Ojt.Ecommerce.repository.PolicyRepository policyRepository;

    @GetMapping
    public List<PolicyResponseDTO> getAll() {
        return policyService.getAll();
    }

    @GetMapping("/{id}")
    public PolicyResponseDTO getById(@PathVariable Long id) {
        return policyService.getById(id);
    }

    @GetMapping("/getreturnpolicy")
    public PolicyResponseDTO getByTitle() {
        return policyService.getByTitle("Return Policy");
    }

    @LogActivity(actionType = "CREATE", entityType = "POLICY", description = "Created policy", severityLevel = "MEDIUM")
    @PostMapping
    public PolicyResponseDTO create(@RequestBody PolicyRequestDTO dto) {
        return policyService.create(dto);
    }

    @LogActivity(actionType = "UPDATE", entityType = "POLICY", description = "Updated policy", severityLevel = "MEDIUM", entityIdParam = "id", logChanges = true)
    @PutMapping("/{id}")
    public PolicyResponseDTO update(@PathVariable Long id, @RequestBody PolicyRequestDTO dto) {
        return policyService.update(id, dto);
    }

    @LogActivity(actionType = "DELETE", entityType = "POLICY", description = "Deleted policy", severityLevel = "HIGH", entityIdParam = "id")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        policyService.delete(id);
    }

    @PostMapping("/seed-return-policy")
    public String seedReturnPolicy() {
        policyService.seedReturnPolicyIfNotExists();
        return "Return policy seeded successfully";
    }
}
