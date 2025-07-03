package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Notification;
import com.Ojt.Ecommerce.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void sendNotification(String username, String message) {


        Notification notification = new Notification();
        notification.setRecipientEmail(username);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setTimestamp(LocalDateTime.now());
        notificationRepository.save(notification);

        // Sends a message to a user-specific queue
        messagingTemplate.convertAndSendToUser(username, "/queue/notifications", notification);
        System.out.println("Sending notification to: " + username);
    }
} 