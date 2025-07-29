package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.PolicyRequestDTO;
import com.Ojt.Ecommerce.dto.PolicyResponseDTO;
import com.Ojt.Ecommerce.entity.Policy;
import com.Ojt.Ecommerce.repository.PolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PolicyService {

    private final PolicyRepository policyRepository;

    public List<PolicyResponseDTO> getAll() {
        return policyRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PolicyResponseDTO getById(Long id) {
        Policy policy = policyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found"));
        return toDTO(policy);
    }

    public PolicyResponseDTO create(PolicyRequestDTO dto) {
        Policy policy = new Policy();
        policy.setTitle(dto.getTitle());
        policy.setContent(dto.getContent());
        policy.setStatus(dto.getStatus() != null ? dto.getStatus() : 1); // Default to Active (1)
        policy.setLastUpdated(LocalDateTime.now());
        return toDTO(policyRepository.save(policy));
    }

    public PolicyResponseDTO update(Long id, PolicyRequestDTO dto) {
        Policy policy = policyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found"));
        policy.setTitle(dto.getTitle());
        policy.setContent(dto.getContent());
        policy.setStatus(dto.getStatus() != null ? dto.getStatus() : 1); // Default to Active (1)
        policy.setLastUpdated(LocalDateTime.now());
        return toDTO(policyRepository.save(policy));
    }

    public void delete(Long id) {
        Policy policy = policyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found"));
        policy.setStatus(2); // Set to Deleted (2) instead of actually deleting
        policyRepository.save(policy);
    }

    private PolicyResponseDTO toDTO(Policy policy) {
        PolicyResponseDTO dto = new PolicyResponseDTO();
        dto.setId(policy.getId());
        dto.setTitle(policy.getTitle());
        dto.setContent(policy.getContent());
        dto.setStatus(policy.getStatus() != null ? policy.getStatus() : 1);
        dto.setLastUpdated(policy.getLastUpdated());
        return dto;
    }
}
