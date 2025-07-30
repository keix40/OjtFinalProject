package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.PolicyRequestDTO;
import com.Ojt.Ecommerce.dto.PolicyResponseDTO;
import com.Ojt.Ecommerce.service.PolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/policies")
@RequiredArgsConstructor
public class PolicyController {

    private final PolicyService policyService;

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

    @PostMapping
    public PolicyResponseDTO create(@RequestBody PolicyRequestDTO dto) {
        return policyService.create(dto);
    }

    @PutMapping("/{id}")
    public PolicyResponseDTO update(@PathVariable Long id, @RequestBody PolicyRequestDTO dto) {
        return policyService.update(id, dto);
    }

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
