package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.NotificationRequestDTO;
import com.Ojt.Ecommerce.entity.Notification;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.repository.NotificationRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("api/notifications")
@CrossOrigin(origins = "http://localhost:4200")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public List<Notification> getUserNotifications(@AuthenticationPrincipal UserDetails user) {
        return notificationRepository.findByRecipientEmail(user.getUsername());
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        if (user == null) {
            return ResponseEntity.status(401).body("User not authenticated");
        }
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

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{id}/unread")
    public ResponseEntity<?> markNotificationAsUnread(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        return notificationRepository.findById(id)
                .map(notification -> {
                    if (!notification.getRecipientEmail().equals(user.getUsername())) {
                        return ResponseEntity.status(403).body("You are not authorized to modify this notification.");
                    }
                    notification.setRead(false);
                    notificationRepository.save(notification);
                    return ResponseEntity.ok(notification);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<?> createNotification(
            @RequestBody NotificationRequestDTO dto,
            @AuthenticationPrincipal UserDetails user
    ) {
        try {
            Notification notification = notificationService.createNotificationForUser(user.getUsername(), dto.getMessage());
            return ResponseEntity.ok(notification);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(
                java.util.Map.of("message", "Failed to create notification: " + e.getMessage())
            );
        }
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/check-first-time-buyer")
    public ResponseEntity<?> checkFirstTimeBuyer(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Notification notification = notificationService.notifyFirstTimeBuyerIfEligible(user);
        if (notification != null) {
            return ResponseEntity.ok(notification);
        } else {
            return ResponseEntity.noContent().build();
        }
    }
}
