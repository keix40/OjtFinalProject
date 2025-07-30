package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.NewsLetterSubscriber;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NewsLetterSubscriberRepository extends JpaRepository<NewsLetterSubscriber,Long> {
    Optional<NewsLetterSubscriber> findByEmail(String email);
}
