package com.Ojt.Ecommerce.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.Ojt.Ecommerce.dto.PolicyRequestDTO;
import com.Ojt.Ecommerce.dto.PolicyResponseDTO;
import com.Ojt.Ecommerce.entity.Policy;
import com.Ojt.Ecommerce.repository.PolicyRepository;

import lombok.RequiredArgsConstructor;

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

    public PolicyResponseDTO getByTitle(String title) {
        Policy policy = policyRepository.findByTitleIgnoreCase(title)
                .orElseThrow(() -> new RuntimeException("Policy with title '" + title + "' not found"));
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

    public void seedReturnPolicyIfNotExists() {
        if (!policyRepository.findByTitleIgnoreCase("Return Policy").isPresent()) {
            Policy returnPolicy = new Policy();
            returnPolicy.setTitle("Return Policy");
            returnPolicy.setContent("<p>Customers are eligible to request returns under the following conditions. All return requests must be reviewed and approved by the admin before any refund or replacement is processed.</p>\n\n<h3>1. Wrong Item Delivered</h3>\n<p>If the item received is different from what was ordered, a return request must be submitted within 7 days of delivery.</p>\n<p>Upon verification, a full refund will be issued.</p>\n\n<h3>2. Damaged on Arrival</h3>\n<p>If the item is received in a damaged or defective condition, photo evidence must be provided.</p>\n<p>After verification by the admin, customers will be offered either a refund or a replacement.</p>\n\n<h3>3. Changed Mind</h3>\n<p>Returns due to a change of mind are accepted only if the product is unused and sealed.</p>\n<p>The customer is responsible for the return shipping costs.</p>\n<p>A refund will be processed after the returned product is inspected and approved.</p>\n\n<h3>4. Return Process</h3>\n<ul>\n<li>Submit return request through the order tracking page</li>\n<li>Provide clear photos of the item condition</li>\n<li>Package item securely for return shipping</li>\n<li>Wait for admin approval before shipping</li>\n<li>Return shipping costs are the responsibility of the customer for change of mind returns</li>\n</ul>\n\n<h3>5. Refund Timeline</h3>\n<ul>\n<li>Refunds will be processed within 5-7 business days after receiving the returned item</li>\n<li>Refunds will be issued to the original payment method</li>\n<li>Processing times may vary depending on your bank or payment provider</li>\n</ul>\n\n<h3>6. Contact Information</h3>\n<p>For questions about returns, please contact our customer service team.</p>");
            returnPolicy.setStatus(1); // Active
            returnPolicy.setLastUpdated(LocalDateTime.now());
            policyRepository.save(returnPolicy);
        }
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
