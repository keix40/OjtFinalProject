package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.DiscountRequestDTO;
import com.Ojt.Ecommerce.dto.NotificationRequestDTO;
import com.Ojt.Ecommerce.entity.Notification;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.repository.NotificationRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final UserRepository userRepository;
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

    public Notification createNotificationForUser(String username, String message) {
        return createNotificationForUser(username, message, null, null);
    }

    public Notification createNotificationForUser(String username, String message, String type, String link) {
        Notification notification = new Notification();
        notification.setRecipientEmail(username);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setTimestamp(LocalDateTime.now());
        notification.setType(type);
        notification.setLink(link);
        notificationRepository.save(notification);
        messagingTemplate.convertAndSendToUser(username, "/queue/notifications", notification);
        return notification;
    }

    public Notification notifyFirstTimeBuyerIfEligible(User user) {
        boolean isNewUser = user.getCreatedDate() != null &&
                user.getCreatedDate().isAfter(LocalDateTime.now().minusDays(7));
        boolean isFirstOrder = user.getOrderCount() == null || user.getOrderCount() == 0;
        Notification lastNotif = notificationRepository
                .findTopByRecipientEmailAndTypeOrderByTimestampDesc(user.getEmail(), "first time buyer discount");

        boolean sentRecently = false;
        if (lastNotif != null) {
            sentRecently = lastNotif.getTimestamp().isAfter(LocalDateTime.now().minusHours(6));
        }

        if ((isNewUser && isFirstOrder)&& !sentRecently ) {
            String message = "🎉 Welcome! First Time Buyer Discount is available for you. Click to view details.";
            String link = "/userproductlist"; // Adjust to your frontend route
            String type = "first time buyer discount";
            return this.createNotificationForUser(user.getEmail(), message, type, link);
        }
        return null;
    }
} 