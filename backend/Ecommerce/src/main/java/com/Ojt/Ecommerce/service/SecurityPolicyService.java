package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.SecurityPolicyRule;
import com.Ojt.Ecommerce.repository.SecurityPolicyRuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SecurityPolicyService {
    @Autowired
    private SecurityPolicyRuleRepository repository;

    public List<SecurityPolicyRule> getAllRules() {
        return repository.findAll();
    }

    public void seedDefaultsIfEmpty() {
        if (repository.count() == 0) {
            repository.save(SecurityPolicyRule.builder().action("email_alert").attempts(2).windowMinutes(15).extraData(null).build());
            repository.save(SecurityPolicyRule.builder().action("require_otp").attempts(3).windowMinutes(15).extraData(null).build());
            repository.save(SecurityPolicyRule.builder().action("ban_ip").attempts(5).windowMinutes(15).extraData("{\"banMinutes\":60}").build());
        }
    }

    public SecurityPolicyRule updateRule(Long id, SecurityPolicyRule updatedRule) {
        SecurityPolicyRule rule = repository.findById(id).orElseThrow();
        rule.setAction(updatedRule.getAction());
        rule.setAttempts(updatedRule.getAttempts());
        rule.setWindowMinutes(updatedRule.getWindowMinutes());
        rule.setExtraData(updatedRule.getExtraData());
        return repository.save(rule);
    }

    public void deleteRule(Long id) {
        repository.deleteById(id);
    }
} 