package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.DiscountRequestDTO;
import com.Ojt.Ecommerce.dto.NotificationDTO;
import com.Ojt.Ecommerce.dto.NotificationRequestDTO;
import com.Ojt.Ecommerce.entity.*;
import com.Ojt.Ecommerce.entity.NotificationTypeEnum;
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
import com.Ojt.Ecommerce.repository.RoleRepository;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final RoleRepository roleRepository;

    public void sendNotification(String username, String message) {
        Optional<User> userOpt = userRepository.findByEmail(username);
        if (userOpt.isEmpty()) {
            System.out.println("User not found: " + username);
            return;
        }

        User user = userOpt.get();

        Notification notification = new Notification();
        notification.setUser(user); // set user relation
        notification.setRecipientEmail(username); // optional
        notification.setMessage(message);
        notification.setRead(false);
        notification.setTimestamp(LocalDateTime.now());
        notification.setUserType(NotificationTypeEnum.CUSTOMER); // or "ADMIN" if for admin dashboard

        notificationRepository.save(notification);
        NotificationDTO dto = new NotificationDTO(notification);

        messagingTemplate.convertAndSendToUser(username, "/queue/notifications", dto);
        System.out.println("Sending notification to: " + username);
    }


    public Notification createNotificationForUser(String username, String message) {
        return createNotificationForUser(username, message, null, null,null);
    }

    public Notification createNotificationForUser(String username, String message, String type, String link,String category) {
        Optional<User> userOpt = userRepository.findByEmail(username);
        if (userOpt.isEmpty()) {
            System.out.println("User not found: " + username);
            return null;
        }

        User user = userOpt.get();
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setRecipientEmail(username);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setTimestamp(LocalDateTime.now());
        notification.setCategory(category);
        notification.setType(type);
        notification.setLink(link);
        notification.setUserType(NotificationTypeEnum.CUSTOMER);
        notificationRepository.save(notification);
        NotificationDTO dto = new NotificationDTO(notification);
        messagingTemplate.convertAndSendToUser(username, "/queue/notifications", dto);

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
            String notiCate = "discount";
            return this.createNotificationForUser(user.getEmail(), message, type, link,notiCate);
        }
        return null;
    }

    public void sendNotificationToRole(Long roleId, String message, String category, String type, String link) {
        List<User> users = userRepository.findByRoleId(roleId);
        NotificationTypeEnum userType = getUserTypeEnumByRoleId(roleId);

        System.out.println("=== DEBUG: sendNotificationToRole ===");
        System.out.println("Role ID: " + roleId);
        System.out.println("Users found: " + users.size());
        System.out.println("UserType enum: " + userType);
        System.out.println("Message: " + message);
        System.out.println("Category: " + category);
        System.out.println("Type: " + type);
        System.out.println("Link: " + link);

        for (User user : users) {
            System.out.println("Sending notification to user: " + user.getEmail() + " with userType: " + userType);
            
            Notification notification = new Notification();
            notification.setUser(user);
            notification.setRecipientEmail(user.getEmail());
            notification.setMessage(message);
            notification.setRead(false);
            notification.setTimestamp(LocalDateTime.now());
            notification.setUserType(userType); // This should be the correct enum
            notification.setCategory(category);
            notification.setType(type);
            notification.setLink(link);

            notificationRepository.save(notification);
            NotificationDTO dto = new NotificationDTO(notification);
            messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/notifications", dto);
            
            System.out.println("Notification saved with ID: " + notification.getId() + " and userType: " + notification.getUserType());
        }
        System.out.println("=== END DEBUG: sendNotificationToRole ===");
    }

    private NotificationTypeEnum getUserTypeEnumByRoleId(Long roleId) {
        System.out.println("=== DEBUG: getUserTypeEnumByRoleId ===");
        System.out.println("Input roleId: " + roleId);
        
        NotificationTypeEnum result;
        switch (roleId.intValue()) {
            case 1: 
                result = NotificationTypeEnum.ADMIN;
                break;
            case 2: 
                result = NotificationTypeEnum.MANAGER;
                break;
            case 3: 
                result = NotificationTypeEnum.SALES_MARKETING;
                break;
            case 4: 
                result = NotificationTypeEnum.CUSTOMER_SUPPORT;
                break;
            case 5: 
                result = NotificationTypeEnum.WAREHOUSE_STAFF;
                break;
            case 6: 
                result = NotificationTypeEnum.CUSTOMER;
                break;
            default: 
                throw new IllegalArgumentException("Unknown role id: " + roleId);
        }
        
        System.out.println("Returning enum: " + result);
        System.out.println("=== END DEBUG: getUserTypeEnumByRoleId ===");
        return result;
    }

    public void sendNotificationToAdmin(String message, String category, String type, String link) {
        sendNotificationToRole(1L, message, category, type, link);
    }

    public void sendNotificationToManager(String message, String category, String type, String link) {
        System.out.println("=== DEBUG: sendNotificationToManager ===");
        System.out.println("Message: " + message);
        System.out.println("Category: " + category);
        System.out.println("Type: " + type);
        System.out.println("Link: " + link);
        
        sendNotificationToRole(2L, message, category, type, link);
        
        System.out.println("=== END DEBUG: sendNotificationToManager ===");
    }

    public void sendNotificationToSalesMarketing(String message, String category, String type, String link) {
        sendNotificationToRole(3L, message, category, type, link);
    }

    public void sendNotificationToCustomerSupport(String message, String category, String type, String link) {
        sendNotificationToRole(4L, message, category, type, link);
    }

    public void sendNotificationToWarehouseStaff(String message, String category, String type, String link) {
        sendNotificationToRole(5L, message, category, type, link);
    }

    public void sendNotificationToCustomer(String message, String category, String type, String link) {
        sendNotificationToRole(6L, message, category, type, link);
    }

    public void sendToAdminAndCustomerSupport(String message, String category, String type, String link) {
        sendNotificationToAdmin(message, category, type, link);
        sendNotificationToCustomerSupport(message, category, type, link);
    }

    /**
     * Send notification to a specific customer by email
     */
    public void sendNotificationToSpecificCustomer(String customerEmail, String message, String category, String type, String link) {
        Optional<User> userOpt = userRepository.findByEmail(customerEmail);
        if (userOpt.isEmpty()) {
            System.out.println("Customer not found: " + customerEmail);
            return;
        }

        User user = userOpt.get();
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setRecipientEmail(customerEmail);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setTimestamp(LocalDateTime.now());
        notification.setUserType(NotificationTypeEnum.CUSTOMER);
        notification.setCategory(category);
        notification.setType(type);
        notification.setLink(link);

        notificationRepository.save(notification);
        NotificationDTO dto = new NotificationDTO(notification);
        messagingTemplate.convertAndSendToUser(customerEmail, "/queue/notifications", dto);
        System.out.println("Sending notification to customer: " + customerEmail);
    }

    /**
     * Get notifications for a specific customer by email
     * Returns: ALL customer notifications + personal notifications for this user
     */
    public List<Notification> getCustomerNotificationsByEmail(String customerEmail) {
        // Get all customer notifications (broadcast messages) - only CUSTOMER type
        List<Notification> allCustomerNotifications = getCustomerNotifications();
        
        // Get personal notifications for this specific customer - only CUSTOMER type
        List<Notification> personalNotifications = notificationRepository.findByRecipientEmailAndUserType(customerEmail, NotificationTypeEnum.CUSTOMER);
        
        // Combine both lists and remove duplicates
        List<Notification> combinedNotifications = new ArrayList<>(allCustomerNotifications);
        combinedNotifications.addAll(personalNotifications);
        
        // Remove duplicates based on notification ID and ensure only CUSTOMER type notifications
        return combinedNotifications.stream()
                .filter(notification -> notification.getUserType() == NotificationTypeEnum.CUSTOMER)
                .collect(Collectors.toMap(
                    Notification::getId,
                    notification -> notification,
                    (existing, replacement) -> existing
                ))
                .values()
                .stream()
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .collect(Collectors.toList());
    }

    // ========== FETCHING METHODS ==========

    /**
     * Get notifications for a specific role
     */
    public List<Notification> getNotificationsByRole(String roleName) {
        return getNotificationsByRole(roleName, null);
    }

    /**
     * Get notifications for a specific role (with email for customer role)
     */
    public List<Notification> getNotificationsByRole(String roleName, String email) {
        switch (roleName.toUpperCase()) {
            case "ADMIN":
                return getAdminNotifications();
            case "MANAGER":
                return getManagerNotifications();
            case "SALES/MARKETING":
                return getSalesMarketingNotifications();
            case "CUSTOMER SUPPORT":
                return getCustomerSupportNotifications();
            case "WAREHOUSE STAFF":
                return getWarehouseStaffNotifications();
            case "CUSTOMER":
                if (email != null) {
                    // Customer user: Get all customer notifications + personal notifications
                    return getCustomerNotificationsByEmail(email);
                } else {
                    // Admin view: Get all customer notifications
                    return getCustomerNotifications();
                }
            default:
                throw new IllegalArgumentException("Unknown role: " + roleName);
        }
    }

    /**
     * Get notifications for a specific role and category
     */
    public List<Notification> getNotificationsByRoleAndCategory(String roleName, String category) {
        List<Notification> roleNotifications = getNotificationsByRole(roleName);
        return roleNotifications.stream()
                .filter(notification -> category.equalsIgnoreCase(notification.getCategory()))
                .collect(Collectors.toList());
    }

    /**
     * Get notifications for a specific role and type
     */
    public List<Notification> getNotificationsByRoleAndType(String roleName, String type) {
        List<Notification> roleNotifications = getNotificationsByRole(roleName);
        return roleNotifications.stream()
                .filter(notification -> type.equalsIgnoreCase(notification.getType()))
                .collect(Collectors.toList());
    }

    /**
     * Get unread notifications count for a specific role
     */
    public long getUnreadNotificationsCountByRole(String roleName) {
        List<Notification> roleNotifications = getNotificationsByRole(roleName);
        return roleNotifications.stream()
                .filter(notification -> !notification.isRead())
                .count();
    }

    public List<Notification> getAdminNotifications() {
        return notificationRepository.findByUserTypeIn(
            List.of(NotificationTypeEnum.ADMIN, NotificationTypeEnum.MANAGER, 
                   NotificationTypeEnum.SALES_MARKETING, NotificationTypeEnum.CUSTOMER_SUPPORT, 
                   NotificationTypeEnum.WAREHOUSE_STAFF)
        );
    }

    public List<Notification> getManagerNotifications() {
        return notificationRepository.findByUserType(NotificationTypeEnum.MANAGER);
    }

    public List<Notification> getSalesMarketingNotifications() {
        return notificationRepository.findByUserType(NotificationTypeEnum.SALES_MARKETING);
    }

    public List<Notification> getCustomerSupportNotifications() {
        return notificationRepository.findByUserType(NotificationTypeEnum.CUSTOMER_SUPPORT);
    }

    public List<Notification> getWarehouseStaffNotifications() {
        return notificationRepository.findByUserType(NotificationTypeEnum.WAREHOUSE_STAFF);
    }

    public List<Notification> getCustomerNotifications() {
        return notificationRepository.findByUserType(NotificationTypeEnum.CUSTOMER);
    }

}