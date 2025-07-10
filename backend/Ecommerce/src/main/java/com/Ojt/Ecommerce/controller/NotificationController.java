package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.entity.Notification;
import com.Ojt.Ecommerce.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public List<Notification> getUserNotifications(@AuthenticationPrincipal UserDetails user) {
        return notificationRepository.findByRecipientEmail(user.getUsername());
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        return notificationRepository.findById(id)
                .map(notification -> {
                    if (!notification.getRecipientEmail().equals(user.getUsername())) {
                        return ResponseEntity.status(403).body("You are not authorized to delete this notification.");
                    }
                    notificationRepository.delete(notification);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{id}/read")
    public ResponseEntity<?> markNotificationAsRead(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        return notificationRepository.findById(id)
                .map(notification -> {
                    if (!notification.getRecipientEmail().equals(user.getUsername())) {
                        return ResponseEntity.status(403).body("You are not authorized to modify this notification.");
                    }
                    notification.setRead(true);
                    notificationRepository.save(notification);
                    return ResponseEntity.ok(notification);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
