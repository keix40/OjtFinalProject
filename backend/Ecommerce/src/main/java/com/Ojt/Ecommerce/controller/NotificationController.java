package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.NotificationRequestDTO;
import com.Ojt.Ecommerce.dto.NotificationDTO;
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
import java.util.ArrayList;
import java.util.Map;
import java.util.stream.Collectors;

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
    public List<NotificationDTO> getUserNotifications(@AuthenticationPrincipal UserDetails user) {
        List<Notification> notifications = notificationService.getCustomerNotificationsByEmail(user.getUsername());
        return notifications.stream().map(NotificationDTO::new).collect(Collectors.toList());
    }

    /**
     * Get user-only notifications (excludes admin notifications)
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/user-only")
    public ResponseEntity<List<NotificationDTO>> getUserOnlyNotifications(@AuthenticationPrincipal UserDetails user) {
        try {
            List<Notification> notifications = notificationService.getCustomerNotificationsByEmail(user.getUsername());
            List<NotificationDTO> dtos = notifications.stream().map(NotificationDTO::new).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ArrayList<>());
        }
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

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/role/{roleName}/type/{type}")
    public ResponseEntity<?> getNotificationsByRoleAndType(@PathVariable String roleName, @PathVariable String type) {
        try {
            return ResponseEntity.ok(notificationService.getNotificationsByRoleAndType(roleName, type));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(
                java.util.Map.of("message", "Failed to fetch notifications: " + e.getMessage())
            );
        }
    }

    /**
     * Get notifications for a specific role
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/role/{roleName}")
    public ResponseEntity<List<Notification>> getNotificationsByRole(@PathVariable String roleName) {
        try {
            List<Notification> notifications = notificationService.getNotificationsByRole(roleName);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ArrayList<>());
        }
    }

    /**
     * Get notifications for a specific role and category
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/role/{roleName}/category/{category}")
    public ResponseEntity<List<Notification>> getNotificationsByRoleAndCategory(
            @PathVariable String roleName, 
            @PathVariable String category) {
        try {
            List<Notification> notifications = notificationService.getNotificationsByRoleAndCategory(roleName, category);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ArrayList<>());
        }
    }

    /**
     * Get unread notifications count for a specific role
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/role/{roleName}/unread-count")
    public ResponseEntity<Long> getUnreadNotificationsCountByRole(@PathVariable String roleName) {
        try {
            long count = notificationService.getUnreadNotificationsCountByRole(roleName);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(0L);
        }
    }

    /**
     * Get notifications for current user based on their role
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/current-user")
    public ResponseEntity<List<NotificationDTO>> getCurrentUserNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            String roleName = user.getRole().getName();
            String userEmail = userDetails.getUsername();
            
            // For customer role, pass the email to get user-specific notifications
            List<Notification> notifications;
            if ("CUSTOMER".equalsIgnoreCase(roleName)) {
                notifications = notificationService.getNotificationsByRole(roleName, userEmail);
            } else {
                notifications = notificationService.getNotificationsByRole(roleName);
            }
            
            List<NotificationDTO> dtos = notifications.stream().map(NotificationDTO::new).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ArrayList<>());
        }
    }

    /**
     * Get role-specific notifications with permissions
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/role-permissions/{roleName}")
    public ResponseEntity<List<NotificationDTO>> getNotificationsByRolePermissions(@PathVariable String roleName) {
        try {
            List<Notification> notifications = notificationService.getNotificationsByRole(roleName);
            List<NotificationDTO> dtos = notifications.stream().map(NotificationDTO::new).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ArrayList<>());
        }
    }

    /**
     * Get role-specific notifications for current user
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/current-user/role-specific")
    public ResponseEntity<List<NotificationDTO>> getCurrentUserRoleSpecificNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            String roleName = user.getRole().getName();
            List<Notification> notifications = notificationService.getNotificationsByRole(roleName);
            List<NotificationDTO> dtos = notifications.stream().map(NotificationDTO::new).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ArrayList<>());
        }
    }

    /**
     * Get notifications for specific categories based on current user's role
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/current-user/category/{category}")
    public ResponseEntity<List<NotificationDTO>> getCurrentUserCategoryNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String category) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            String roleName = user.getRole().getName();
            List<Notification> notifications = notificationService.getNotificationsByRoleAndCategory(roleName, category);
            List<NotificationDTO> dtos = notifications.stream().map(NotificationDTO::new).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ArrayList<>());
        }
    }
    /**
     * Get notifications specifically for admin users only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin-only")
    public ResponseEntity<List<NotificationDTO>> getAdminOnlyNotifications() {
        try {
            List<Notification> notifications = notificationService.getAdminNotifications();
            List<NotificationDTO> dtos = notifications.stream().map(NotificationDTO::new).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ArrayList<>());
        }
    }
}
