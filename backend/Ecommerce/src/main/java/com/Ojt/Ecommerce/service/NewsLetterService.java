package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.NewsLetterSubscriber;
import com.Ojt.Ecommerce.repository.NewsLetterSubscriberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class NewsLetterService {
    @Autowired
    private NewsLetterSubscriberRepository repo;

    public boolean subscribe(String email) {
        if (repo.findByEmail(email).isPresent()) return false;
        repo.save(NewsLetterSubscriber.builder().email(email).build());
        return true;
    }

    public java.util.List<NewsLetterSubscriber> getAllSubscribers() {
        return repo.findAll();
    }

    public java.util.List<String> getAllSubscriberEmails() {
        return repo.findAll().stream().map(NewsLetterSubscriber::getEmail).toList();
    }
}
