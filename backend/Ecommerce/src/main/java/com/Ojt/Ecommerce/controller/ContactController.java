package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.ContactRequest;
import com.Ojt.Ecommerce.entity.ContactMessage;
import com.Ojt.Ecommerce.repository.ContactMessageRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
@CrossOrigin
public class ContactController {

    @Autowired
    private ContactMessageRepository contactRepo;

    @PostMapping
    public ResponseEntity<String> handleContactForm(@RequestBody ContactRequest request) {
        ContactMessage message = new ContactMessage();
        message.setName(request.getName());
        message.setEmail(request.getEmail());
        message.setSubject(request.getSubject());
        message.setMessage(request.getMessage());

        contactRepo.save(message);

        return ResponseEntity.ok("Message received successfully!");
    }

    // Optional: For admin viewing all messages
    @GetMapping("/all")
    public ResponseEntity<?> getAllMessages() {
        return ResponseEntity.ok(contactRepo.findAll());
    }
}
