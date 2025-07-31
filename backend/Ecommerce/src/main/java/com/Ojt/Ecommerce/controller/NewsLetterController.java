package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.service.NewsLetterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.Ojt.Ecommerce.annotations.LogActivity;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/newsletter")
public class NewsLetterController {
    @Autowired
    private NewsLetterService newsletterService;



    @LogActivity(actionType = "CREATE", entityType = "NEWSLETTER", description = "Subscribed to newsletter", severityLevel = "LOW")
    @PostMapping("/subscribe")
    public ResponseEntity<Map<String, String>> subscribe(@RequestParam String email) {
        boolean success = newsletterService.subscribe(email);
        Map<String, String> response = new HashMap<>();
        response.put("message", success ? "Subscribed successfully!" : "Email already subscribed.");
        return ResponseEntity.ok(response);
    }
}
