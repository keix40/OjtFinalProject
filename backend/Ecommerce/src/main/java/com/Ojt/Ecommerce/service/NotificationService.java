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
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.Ojt.Ecommerce.entity.UserOrder;
import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.repository.RoleRepository;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final RoleRepository roleRepository;

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

        if ((isNewUser && isFirstOrder) && !sentRecently) {
            String message = "🎉 Welcome! First Time Buyer Discount is available for you. Click to view details.";
            String link = "/userproductlist"; // Adjust to your frontend route
            String type = "first time buyer discount";
            return this.createNotificationForUser(user.getEmail(), message, type, link);
        }
        return null;
    }

    public List<Notification> sendNotificationToAllAdmins(String message, String type, String link) {
        // Find all users with admin role (role_id = 1 for admin)
        List<User> adminUsers = userRepository.findByRoleId(1L);

        List<Notification> notifications = new ArrayList<>();

        for (User admin : adminUsers) {
            Notification notification = new Notification();
            notification.setRecipientEmail(admin.getEmail());
            notification.setMessage(message);
            notification.setRead(false);
            notification.setTimestamp(LocalDateTime.now());
            notification.setType(type);
            notification.setLink(link);

            // Set category based on type
            if ("login_attempt".equals(type)) {
                notification.setCategory("login_attempt");
                notification.setPriority("high");
            } else {
                notification.setCategory("admin_only");
                notification.setPriority("medium");
            }

            // Save notification
            Notification savedNotification = notificationRepository.save(notification);
            notifications.add(savedNotification);

            // Send real-time notification via WebSocket
            messagingTemplate.convertAndSendToUser(admin.getEmail(), "/queue/notifications", savedNotification);

            System.out.println("Sending admin notification to: " + admin.getEmail());
        }

        return notifications;
    }

    public List<Notification> sendNotificationToAllAdmins(String message) {
        return sendNotificationToAllAdmins(message, "admin_notification", null);
    }

    public List<Notification> sendSystemAlertToAdmins(String alertMessage, String severity) {
        String message = "🚨 SYSTEM ALERT (" + severity + "): " + alertMessage;
        String type = "system_alert_" + severity.toLowerCase();
        String link = "/admin/dashboard"; // Link to admin dashboard

        return sendNotificationToAllAdmins(message, type, link);
    }

    public List<Notification> getAllAdminNotifications() {
        return notificationRepository.findByRecipientEmailIn(
                userRepository.findByRoleId(1L).stream()
                        .map(User::getEmail)
                        .collect(Collectors.toList())
        );
    }

    public List<Notification> getAdminNotificationsByType(String type) {
        List<String> adminEmails = userRepository.findByRoleId(1L).stream()
                .map(User::getEmail)
                .collect(Collectors.toList());

        return notificationRepository.findByRecipientEmailInAndType(adminEmails, type);
    }

    public List<Notification> getUnreadAdminNotifications() {
        List<String> adminEmails = userRepository.findByRoleId(1L).stream()
                .map(User::getEmail)
                .collect(Collectors.toList());

        return notificationRepository.findByRecipientEmailInAndReadFalse(adminEmails);
    }

    public Page<Notification> getAdminNotificationsWithPagination(int page, int size) {
        List<String> adminEmails = userRepository.findByRoleId(1L).stream()
                .map(User::getEmail)
                .collect(Collectors.toList());

        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        return notificationRepository.findByRecipientEmailIn(adminEmails, pageable);
    }

    public List<Notification> getAdminNotificationsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        List<String> adminEmails = userRepository.findByRoleId(1L).stream()
                .map(User::getEmail)
                .collect(Collectors.toList());

        return notificationRepository.findByRecipientEmailInAndTimestampBetween(
                adminEmails, startDate, endDate
        );
    }

    public Map<String, Object> getAdminNotificationStatistics() {
        List<String> adminEmails = userRepository.findByRoleId(1L).stream()
                .map(User::getEmail)
                .collect(Collectors.toList());

        long totalNotifications = notificationRepository.countByRecipientEmailIn(adminEmails);
        long unreadNotifications = notificationRepository.countByRecipientEmailInAndReadFalse(adminEmails);
        long todayNotifications = notificationRepository.countByRecipientEmailInAndTimestampAfter(
                adminEmails, LocalDateTime.now().withHour(0).withMinute(0).withSecond(0)
        );

        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalNotifications", totalNotifications);
        statistics.put("unreadNotifications", unreadNotifications);
        statistics.put("todayNotifications", todayNotifications);
        statistics.put("readNotifications", totalNotifications - unreadNotifications);

        return statistics;
    }

    public Notification markAdminNotificationAsRead(Long notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);

        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            notification.setRead(true);
            return notificationRepository.save(notification);
        }

        return null;
    }

    public int markAllAdminNotificationsAsRead() {
        List<String> adminEmails = userRepository.findByRoleId(1L).stream()
                .map(User::getEmail)
                .collect(Collectors.toList());

        return notificationRepository.markAllAsReadByRecipientEmailIn(adminEmails);
    }

    public boolean deleteAdminNotification(Long notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);

        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            // Check if the notification belongs to an admin
            List<String> adminEmails = userRepository.findByRoleId(1L).stream()
                    .map(User::getEmail)
                    .collect(Collectors.toList());

            if (adminEmails.contains(notification.getRecipientEmail())) {
                notificationRepository.delete(notification);
                return true;
            }
        }

        return false;
    }


    /**
     * Send notification to admin users only
     */
    public void sendNotificationToAdminOnly(String message, String type, String link) {
        try {
            // Get admin role ID (assuming admin role ID is 1)
            Role adminRole = roleRepository.findById(1L)
                    .orElseThrow(() -> new RuntimeException("Admin role not found"));

            List<User> adminUsers = userRepository.findByRoleId(adminRole.getId());

            for (User admin : adminUsers) {
                Notification notification = new Notification();
                notification.setRecipientEmail(admin.getEmail());
                notification.setMessage(message);
                notification.setRead(false);
                notification.setTimestamp(LocalDateTime.now());
                notification.setType(type);
                notification.setLink(link);

                // Set category and priority based on type
                if ("login_attempt".equals(type)) {
                    notification.setCategory("login_attempt");
                    notification.setPriority("high");
                } else {
                    notification.setCategory("admin_only");
                    notification.setPriority("medium");
                }

                // Save notification
                Notification savedNotification = notificationRepository.save(notification);

                // Send real-time notification via WebSocket
                messagingTemplate.convertAndSendToUser(admin.getEmail(), "/queue/notifications", savedNotification);

                System.out.println("Admin notification sent to: " + admin.getEmail());
            }
        } catch (Exception e) {
            System.err.println("Error sending admin notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Send notification to manager and admin users
     */
    public void sendNotificationToManagerAndAdmin(String message, String type, String link) {
        try {
            System.out.println("=== DEBUG: sendNotificationToManagerAndAdmin ===");
            System.out.println("Message: " + message);
            System.out.println("Type: " + type);
            System.out.println("Link: " + link);
            
            // Get admin role ID (assuming admin role ID is 1)
            Role adminRole = roleRepository.findById(1L)
                    .orElseThrow(() -> new RuntimeException("Admin role not found"));
            System.out.println("Admin role found: " + adminRole.getName() + " (ID: " + adminRole.getId() + ")");

            // Get manager role ID (assuming manager role ID is 2)
            Role managerRole = roleRepository.findById(2L)
                    .orElseThrow(() -> new RuntimeException("Manager role not found"));
            System.out.println("Manager role found: " + managerRole.getName() + " (ID: " + managerRole.getId() + ")");

            List<User> adminUsers = userRepository.findByRoleId(adminRole.getId());
            List<User> managerUsers = userRepository.findByRoleId(managerRole.getId());
            
            System.out.println("Admin users found: " + adminUsers.size());
            adminUsers.forEach(user -> System.out.println("  - Admin: " + user.getEmail()));
            
            System.out.println("Manager users found: " + managerUsers.size());
            managerUsers.forEach(user -> System.out.println("  - Manager: " + user.getEmail()));

            // If no manager users exist, log a warning
            if (managerUsers.isEmpty()) {
                System.out.println("⚠️  WARNING: No users with MANAGER role found in database!");
                System.out.println("   This is why manager notifications are not showing.");
                System.out.println("   You need to create a user with MANAGER role first.");
            }

            // Send to admin users
            for (User admin : adminUsers) {
                Notification notification = new Notification();
                notification.setRecipientEmail(admin.getEmail());
                notification.setMessage(message);
                notification.setRead(false);
                notification.setTimestamp(LocalDateTime.now());
                notification.setType(type);
                notification.setLink(link);
                notification.setCategory("order");
                notification.setPriority("high");

                Notification savedNotification = notificationRepository.save(notification);
                messagingTemplate.convertAndSendToUser(admin.getEmail(), "/queue/notifications", savedNotification);

                System.out.println("Manager+Admin notification sent to admin: " + admin.getEmail());
            }

            // Send to manager users
            for (User manager : managerUsers) {
                Notification notification = new Notification();
                notification.setRecipientEmail(manager.getEmail());
                notification.setMessage(message);
                notification.setRead(false);
                notification.setTimestamp(LocalDateTime.now());
                notification.setType(type);
                notification.setLink(link);
                notification.setCategory("order");
                notification.setPriority("high");

                Notification savedNotification = notificationRepository.save(notification);
                messagingTemplate.convertAndSendToUser(manager.getEmail(), "/queue/notifications", savedNotification);

                System.out.println("Manager+Admin notification sent to manager: " + manager.getEmail());
            }
            
            System.out.println("=== END DEBUG: sendNotificationToManagerAndAdmin ===");
        } catch (Exception e) {
            System.err.println("Error sending manager and admin notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // 3. Send to Sales Manager and Admin
    public void sendNotificationToSalesManagerAndAdmin(String message, String type, String link) {
        try {
            // Get admin role ID (assuming admin role ID is 1)
            Role adminRole = roleRepository.findById(1L)
                    .orElseThrow(() -> new RuntimeException("Admin role not found"));

            // Get sales/marketing role ID (assuming sales role ID is 3)
            Role salesRole = roleRepository.findById(3L)
                    .orElseThrow(() -> new RuntimeException("Sales/Marketing role not found"));

            List<User> adminUsers = userRepository.findByRoleId(adminRole.getId());
            List<User> salesUsers = userRepository.findByRoleId(salesRole.getId());

            // Send to admin users
            for (User admin : adminUsers) {
                Notification notification = new Notification();
                notification.setRecipientEmail(admin.getEmail());
                notification.setMessage(message);
                notification.setRead(false);
                notification.setTimestamp(LocalDateTime.now());
                notification.setType(type);
                notification.setLink(link);
                notification.setCategory("sales");
                notification.setPriority("medium");

                Notification savedNotification = notificationRepository.save(notification);
                messagingTemplate.convertAndSendToUser(admin.getEmail(), "/queue/notifications", savedNotification);

                System.out.println("Sales+Admin notification sent to admin: " + admin.getEmail());
            }

            // Send to sales users
            for (User sales : salesUsers) {
                Notification notification = new Notification();
                notification.setRecipientEmail(sales.getEmail());
                notification.setMessage(message);
                notification.setRead(false);
                notification.setTimestamp(LocalDateTime.now());
                notification.setType(type);
                notification.setLink(link);
                notification.setCategory("sales");
                notification.setPriority("medium");

                Notification savedNotification = notificationRepository.save(notification);
                messagingTemplate.convertAndSendToUser(sales.getEmail(), "/queue/notifications", savedNotification);

                System.out.println("Sales+Admin notification sent to sales: " + sales.getEmail());
            }
        } catch (Exception e) {
            System.err.println("Error sending sales manager and admin notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Send notification to customer support and admin users
     */
    public void sendNotificationToCustomerSupportAndAdmin(String message, String type, String link) {
        try {
            // Get admin role ID (assuming admin role ID is 1)
            Role adminRole = roleRepository.findById(1L)
                    .orElseThrow(() -> new RuntimeException("Admin role not found"));

            // Get customer support role ID (assuming customer support role ID is 4)
            Role customerSupportRole = roleRepository.findById(4L)
                    .orElseThrow(() -> new RuntimeException("Customer Support role not found"));

            List<User> adminUsers = userRepository.findByRoleId(adminRole.getId());
            List<User> customerSupportUsers = userRepository.findByRoleId(customerSupportRole.getId());

            // Send to admin users
            for (User admin : adminUsers) {
                Notification notification = new Notification();
                notification.setRecipientEmail(admin.getEmail());
                notification.setMessage(message);
                notification.setRead(false);
                notification.setTimestamp(LocalDateTime.now());
                notification.setType(type);
                notification.setLink(link);
                notification.setCategory("support");
                notification.setPriority("medium");

                Notification savedNotification = notificationRepository.save(notification);
                messagingTemplate.convertAndSendToUser(admin.getEmail(), "/queue/notifications", savedNotification);

                System.out.println("Support+Admin notification sent to admin: " + admin.getEmail());
            }

            // Send to customer support users
            for (User support : customerSupportUsers) {
                Notification notification = new Notification();
                notification.setRecipientEmail(support.getEmail());
                notification.setMessage(message);
                notification.setRead(false);
                notification.setTimestamp(LocalDateTime.now());
                notification.setType(type);
                notification.setLink(link);
                notification.setCategory("support");
                notification.setPriority("medium");

                Notification savedNotification = notificationRepository.save(notification);
                messagingTemplate.convertAndSendToUser(support.getEmail(), "/queue/notifications", savedNotification);

                System.out.println("Support+Admin notification sent to support: " + support.getEmail());
            }
        } catch (Exception e) {
            System.err.println("Error sending customer support and admin notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Send notification to warehouse staff and admin users
     */
    public void sendNotificationToWarehouseStaffAndAdmin(String message, String type, String link) {
        try {
            // Get admin role ID (assuming admin role ID is 1)
            Role adminRole = roleRepository.findById(1L)
                    .orElseThrow(() -> new RuntimeException("Admin role not found"));

            // Get warehouse staff role ID (assuming warehouse staff role ID is 5)
            Role warehouseRole = roleRepository.findById(5L)
                    .orElseThrow(() -> new RuntimeException("Warehouse Staff role not found"));

            List<User> adminUsers = userRepository.findByRoleId(adminRole.getId());
            List<User> warehouseUsers = userRepository.findByRoleId(warehouseRole.getId());

            // Send to admin users
            for (User admin : adminUsers) {
                Notification notification = new Notification();
                notification.setRecipientEmail(admin.getEmail());
                notification.setMessage(message);
                notification.setRead(false);
                notification.setTimestamp(LocalDateTime.now());
                notification.setType(type);
                notification.setLink(link);
                notification.setCategory("warehouse");
                notification.setPriority("medium");

                Notification savedNotification = notificationRepository.save(notification);
                messagingTemplate.convertAndSendToUser(admin.getEmail(), "/queue/notifications", savedNotification);

                System.out.println("Warehouse+Admin notification sent to admin: " + admin.getEmail());
            }

            // Send to warehouse users
            for (User warehouse : warehouseUsers) {
                Notification notification = new Notification();
                notification.setRecipientEmail(warehouse.getEmail());
                notification.setMessage(message);
                notification.setRead(false);
                notification.setTimestamp(LocalDateTime.now());
                notification.setType(type);
                notification.setLink(link);
                notification.setCategory("warehouse");
                notification.setPriority("medium");

                Notification savedNotification = notificationRepository.save(notification);
                messagingTemplate.convertAndSendToUser(warehouse.getEmail(), "/queue/notifications", savedNotification);

                System.out.println("Warehouse+Admin notification sent to warehouse: " + warehouse.getEmail());
            }
        } catch (Exception e) {
            System.err.println("Error sending warehouse staff and admin notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Send notification to specific roles
     */
    public void sendNotificationToRoles(String message, String type, String link, String category, List<String> roleNames) {
        try {
            for (String roleName : roleNames) {
                // Get role ID from role name
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

                List<User> usersWithRole = userRepository.findByRoleId(role.getId());

                for (User user : usersWithRole) {
                    Notification notification = new Notification();
                    notification.setRecipientEmail(user.getEmail());
                    notification.setMessage(message);
                    notification.setRead(false);
                    notification.setTimestamp(LocalDateTime.now());
                    notification.setType(type);
                    notification.setLink(link);
                    notification.setCategory(category);
                    notification.setPriority("medium");

                    Notification savedNotification = notificationRepository.save(notification);
                    messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/notifications", savedNotification);

                    System.out.println("Role-based notification sent to " + roleName + ": " + user.getEmail());
                }
            }
        } catch (Exception e) {
            System.err.println("Error sending role-based notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ===== ROLE-BASED NOTIFICATION RETRIEVAL METHODS =====

    /**
     * Get notifications for users of a specific role
     */
    public List<Notification> getNotificationsByRole(String roleName) {
        try {
            // Get role ID from role name
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

            List<User> usersWithRole = userRepository.findByRoleId(role.getId());
            List<String> emails = usersWithRole.stream()
                    .map(User::getEmail)
                    .collect(Collectors.toList());

            if (emails.isEmpty()) {
                return new ArrayList<>();
            }

            return notificationRepository.findByRecipientEmailIn(emails);
        } catch (Exception e) {
            System.err.println("Error getting notifications by role: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    /**
     * Get notifications for users of a specific role and category
     */
    public List<Notification> getNotificationsByRoleAndCategory(String roleName, String category) {
        try {
            // Get role ID from role name
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

            List<User> usersWithRole = userRepository.findByRoleId(role.getId());
            List<String> emails = usersWithRole.stream()
                    .map(User::getEmail)
                    .collect(Collectors.toList());

            if (emails.isEmpty()) {
                return new ArrayList<>();
            }

            return notificationRepository.findByRecipientEmailInAndCategory(emails, category);
        } catch (Exception e) {
            System.err.println("Error getting notifications by role and category: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    /**
     * Get notifications for users of a specific role and type
     */
    public List<Notification> getNotificationsByRoleAndType(String roleName, String type) {
        try {
            // Get role ID from role name
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

            List<User> usersWithRole = userRepository.findByRoleId(role.getId());
            List<String> emails = usersWithRole.stream()
                    .map(User::getEmail)
                    .collect(Collectors.toList());

            if (emails.isEmpty()) {
                return new ArrayList<>();
            }

            return notificationRepository.findByRecipientEmailInAndType(emails, type);
        } catch (Exception e) {
            System.err.println("Error getting notifications by role and type: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    /**
     * Get unread notifications count for users of a specific role
     */
    public long getUnreadNotificationsCountByRole(String roleName) {
        try {
            // Get role ID from role name
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

            List<User> usersWithRole = userRepository.findByRoleId(role.getId());
            List<String> emails = usersWithRole.stream()
                    .map(User::getEmail)
                    .collect(Collectors.toList());

            if (emails.isEmpty()) {
                return 0L;
            }

            return notificationRepository.countByRecipientEmailInAndReadFalse(emails);
        } catch (Exception e) {
            System.err.println("Error getting unread notifications count by role: " + e.getMessage());
            e.printStackTrace();
            return 0L;
        }
    }

    /**
     * Get notifications for current user based on their role
     */
    public List<Notification> getCurrentUserNotifications(String userEmail) {
        try {
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

            String roleName = user.getRole().getName();
            return getNotificationsByRole(roleName);
        } catch (Exception e) {
            System.err.println("Error getting current user notifications: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    /**
     * Get role-specific notifications with category filtering
     */
    public List<Notification> getRoleSpecificNotifications(String roleName, List<String> allowedCategories) {
        try {
            List<Notification> allNotifications = new ArrayList<>();

            for (String category : allowedCategories) {
                List<Notification> categoryNotifications = getNotificationsByRoleAndCategory(roleName, category);
                allNotifications.addAll(categoryNotifications);
            }

            // Remove duplicates and sort by timestamp (newest first)
            return allNotifications.stream()
                    .distinct()
                    .sorted((n1, n2) -> n2.getTimestamp().compareTo(n1.getTimestamp()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error getting role-specific notifications: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    /**
     * Get notifications based on role permissions
     */
    public List<Notification> getNotificationsByRolePermissions(String roleName) {
        try {
            // Get role ID from role name
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
            
            List<User> usersWithRole = userRepository.findByRoleId(role.getId());
            List<String> emails = usersWithRole.stream()
                    .map(User::getEmail)
                    .collect(Collectors.toList());
            
            if (emails.isEmpty()) {
                return new ArrayList<>();
            }
            
            // For manager users, also include notifications sent to admin users
            if ("MANAGER".equals(roleName)) {
                Role adminRole = roleRepository.findById(1L)
                        .orElseThrow(() -> new RuntimeException("Admin role not found"));
                
                List<User> adminUsers = userRepository.findByRoleId(adminRole.getId());
                List<String> adminEmails = adminUsers.stream()
                        .map(User::getEmail)
                        .collect(Collectors.toList());
                
                // Combine manager and admin emails
                emails.addAll(adminEmails);
            }
            
            // Get notifications specifically for this role's users (role-based notifications)
            return notificationRepository.findByRecipientEmailIn(emails).stream()
                    .sorted((n1, n2) -> n2.getTimestamp().compareTo(n1.getTimestamp()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error getting notifications by role permissions: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
        /**
         * Get notifications specifically for admin users only
         */
        public List<Notification> getAdminOnlyNotifications() {
            try {
                // Get admin role ID (assuming admin role ID is 1)
                Role adminRole = roleRepository.findById(1L)
                        .orElseThrow(() -> new RuntimeException("Admin role not found"));
                
                // Get manager role ID (assuming manager role ID is 2)
                Role managerRole = roleRepository.findById(2L)
                        .orElseThrow(() -> new RuntimeException("Manager role not found"));
                
                List<User> adminUsers = userRepository.findByRoleId(adminRole.getId());
                List<User> managerUsers = userRepository.findByRoleId(managerRole.getId());
                
                // Combine emails from both admin and manager users
                List<String> allEmails = new ArrayList<>();
                allEmails.addAll(adminUsers.stream().map(User::getEmail).collect(Collectors.toList()));
                allEmails.addAll(managerUsers.stream().map(User::getEmail).collect(Collectors.toList()));
                
                if (allEmails.isEmpty()) {
                    return new ArrayList<>();
                }
                
                // Get notifications sent to both admin and manager users
                return notificationRepository.findByRecipientEmailIn(allEmails).stream()
                        .sorted((n1, n2) -> n2.getTimestamp().compareTo(n1.getTimestamp()))
                        .collect(Collectors.toList());
            } catch (Exception e) {
                System.err.println("Error getting admin-only notifications: " + e.getMessage());
                e.printStackTrace();
                return new ArrayList<>();
            }
        }

    /**
     * Send notification to current user only if they have one of the specified roles
     */
    public void sendNotificationToCurrentUserIfRoles(String userEmail, String message, String type, String link, String... allowedRoles) {
        try {
            // Get the user by email
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));
            
            String userRole = user.getRole().getName();
            
            // Check if user has any of the allowed roles
            boolean hasAllowedRole = false;
            for (String role : allowedRoles) {
                if (role.equals(userRole)) {
                    hasAllowedRole = true;
                    break;
                }
            }
            
            // Only send notification if user has an allowed role
            if (hasAllowedRole) {
                Notification notification = new Notification();
                notification.setRecipientEmail(userEmail);
                notification.setMessage(message);
                notification.setRead(false);
                notification.setTimestamp(LocalDateTime.now());
                notification.setType(type);
                notification.setLink(link);
                notification.setCategory("support");
                notification.setPriority("medium");

                Notification savedNotification = notificationRepository.save(notification);
                messagingTemplate.convertAndSendToUser(userEmail, "/queue/notifications", savedNotification);

                System.out.println("Notification sent to current user: " + userEmail + " (Role: " + userRole + ")");
            } else {
                System.out.println("User " + userEmail + " has role " + userRole + " - no notification sent");
            }
        } catch (Exception e) {
            System.err.println("Error sending notification to current user: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Send notification to current user only if they are Customer Support or Admin
     */
    public void sendNotificationToCurrentUserIfRole(String userEmail, String message, String type, String link) {
        sendNotificationToCurrentUserIfRoles(userEmail, message, type, link, "CUSTOMER SUPPORT", "ADMIN");
    }

    /**
     * Send notification to current user only if they are Admin or Manager
     */
    public void sendNotificationToCurrentUserIfAdminOrManager(String userEmail, String message, String type, String link) {
        sendNotificationToCurrentUserIfRoles(userEmail, message, type, link, "ADMIN", "MANAGER");
    }

    /**
     * Send notification to current user only if they are Sales Manager or Admin
     */
    public void sendNotificationToCurrentUserIfSalesManagerOrAdmin(String userEmail, String message, String type, String link) {
        sendNotificationToCurrentUserIfRoles(userEmail, message, type, link, "SALES MANAGER", "ADMIN");
    }

    /**
     * Send notification to current user only if they are Warehouse Staff or Admin
     */
    public void sendNotificationToCurrentUserIfWarehouseOrAdmin(String userEmail, String message, String type, String link) {
        sendNotificationToCurrentUserIfRoles(userEmail, message, type, link, "WAREHOUSE STAFF", "ADMIN");
    }

    /**
     * Get notifications for regular users only (excluding admin notifications)
     */
    public List<Notification> getUserOnlyNotifications(String userEmail) {
        try {
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

            // Get all notifications for this user
            List<Notification> userNotifications = notificationRepository.findByRecipientEmail(userEmail);
            
            // Filter to show only user-appropriate notifications
            return userNotifications.stream()
                    .filter(notification -> {
                        String type = notification.getType();
                        if (type == null) return true; // Keep notifications without type
                        
                        // List of admin-specific notification types to exclude
                        String[] adminTypes = {
                            "admin_only",
                            "login_attempt", 
                            "order_created",
                            "review_submitted",
                            "system_alert_high",
                            "system_alert_medium",
                            "system_alert_low"
                        };
                        
                        // Check if this is an admin-specific notification
                        for (String adminType : adminTypes) {
                            if (adminType.equals(type)) {
                                return false; // Exclude this notification
                            }
                        }
                        
                        // List of user-appropriate notification types to include
                        String[] userTypes = {
                            "order",
                            "discount",
                            "first time buyer discount"
                        };
                        
                        // Check if this is a user-appropriate notification
                        for (String userType : userTypes) {
                            if (userType.equals(type)) {
                                return true; // Include this notification
                            }
                        }
                        
                        // For any other type, exclude it (to be safe)
                        return false;
                    })
                    .sorted((n1, n2) -> n2.getTimestamp().compareTo(n1.getTimestamp()))
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            System.err.println("Error getting user-only notifications: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    }