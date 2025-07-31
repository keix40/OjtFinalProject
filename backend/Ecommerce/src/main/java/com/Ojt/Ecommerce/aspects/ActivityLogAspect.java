package com.Ojt.Ecommerce.aspects;

import com.Ojt.Ecommerce.annotations.LogActivity;
import com.Ojt.Ecommerce.entity.ActivityLog;
import com.Ojt.Ecommerce.service.ActivityLogService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.util.ContentCachingRequestWrapper;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import com.Ojt.Ecommerce.security.CustomUserDetails;
import com.Ojt.Ecommerce.entity.User;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import com.Ojt.Ecommerce.dto.UserDTO;
import com.Ojt.Ecommerce.util.IpLocationUtil;
import com.Ojt.Ecommerce.repository.UserRepository;
import com.Ojt.Ecommerce.repository.ProductRepository;
import com.Ojt.Ecommerce.repository.CategoryRepository;
import com.Ojt.Ecommerce.repository.BrandRepository;
import com.Ojt.Ecommerce.repository.AddressRepository;
import com.Ojt.Ecommerce.repository.OrderRepository;
import com.Ojt.Ecommerce.entity.Discount;
import com.Ojt.Ecommerce.dto.DiscountRequestDTO;
import com.Ojt.Ecommerce.repository.DiscountRepository;
import java.io.BufferedReader;
import java.io.IOException;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;
import com.Ojt.Ecommerce.entity.Attribute;
import com.Ojt.Ecommerce.entity.AttributeValue;
import com.Ojt.Ecommerce.entity.VariantAttributeValue;
import com.Ojt.Ecommerce.entity.ProductVariant;
import com.Ojt.Ecommerce.entity.ProductImage;
import com.Ojt.Ecommerce.entity.Role;
import com.Ojt.Ecommerce.entity.Permission;
import com.Ojt.Ecommerce.entity.DeliveryService;
import com.Ojt.Ecommerce.entity.Policy;
import com.Ojt.Ecommerce.entity.Appeal;
import com.Ojt.Ecommerce.entity.RevenueTarget;
import com.Ojt.Ecommerce.entity.Notification;
import com.Ojt.Ecommerce.entity.ContactMessage;
import com.Ojt.Ecommerce.entity.NewsLetterSubscriber;
import com.Ojt.Ecommerce.entity.SavedCard;
import com.Ojt.Ecommerce.entity.LoginAttempt;

@Aspect
@Component
public class ActivityLogAspect {

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private UserRepository userRepository;

    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private BrandRepository brandRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private DiscountRepository discountRepository;
    @Autowired private com.Ojt.Ecommerce.repository.AttributeValueRepository attrValueRepo;
    @Autowired private com.Ojt.Ecommerce.repository.ReturnRequestRepository returnRequestRepository;
    @Autowired private com.Ojt.Ecommerce.repository.ReviewRepository reviewRepository;
    @Autowired private com.Ojt.Ecommerce.repository.WishlistRepository wishlistRepository;
    @Autowired private com.Ojt.Ecommerce.repository.EventRepository eventRepository;
    @Autowired private com.Ojt.Ecommerce.repository.BlacklistRepository blacklistRepository;
    @Autowired private com.Ojt.Ecommerce.repository.VipTierRepository vipTierRepository;
    @Autowired private com.Ojt.Ecommerce.repository.RoleRepository roleRepository;
    @Autowired private com.Ojt.Ecommerce.repository.PermissionRepository permissionRepository;
    @Autowired private com.Ojt.Ecommerce.repository.UserRepository adminUserRepository;
    @Autowired private com.Ojt.Ecommerce.repository.AttributeRepository attributeRepository;
    @Autowired private com.Ojt.Ecommerce.repository.DeliveryServiceRepository deliveryServiceRepository;
    @Autowired private com.Ojt.Ecommerce.repository.PolicyRepository policyRepository;
    @Autowired private com.Ojt.Ecommerce.repository.AppealRepository appealRepository;
    @Autowired private com.Ojt.Ecommerce.repository.RevenueTargetRepository revenueTargetRepository;
    @Autowired private com.Ojt.Ecommerce.repository.NotificationRepository notificationRepository;
    @Autowired private com.Ojt.Ecommerce.repository.ContactMessageRepository contactRepository;
    @Autowired private com.Ojt.Ecommerce.repository.NewsLetterSubscriberRepository newsLetterRepository;
    @Autowired private com.Ojt.Ecommerce.repository.SavedCardRepository savedCardRepository;
    @Autowired private com.Ojt.Ecommerce.repository.LoginAttemptRepository loginAttemptRepository;

    @Autowired
    private ObjectMapper objectMapper;



    @Around("@annotation(com.Ojt.Ecommerce.annotations.LogActivity)")
    public Object logActivity(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        LogActivity logActivity = method.getAnnotation(LogActivity.class);

        // Start timing for duration tracking
        LocalDateTime startTime = LocalDateTime.now();

        // Get current user information
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = null;
        String userName = "";
        String userRole = "";


        
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            
            if (principal instanceof com.Ojt.Ecommerce.dto.UserDTO) {
                com.Ojt.Ecommerce.dto.UserDTO user = (com.Ojt.Ecommerce.dto.UserDTO) principal;
                userId = user.getId();
                userName = user.getName();
                userRole = user.getRoleName();
            } else if (principal instanceof com.Ojt.Ecommerce.entity.User) {
                com.Ojt.Ecommerce.entity.User user = (com.Ojt.Ecommerce.entity.User) principal;
                userId = user.getId();
                userName = user.getName();
                userRole = user.getRole() != null ? user.getRole().getName() : "UNKNOWN";
            } else if (principal instanceof String) {
                // Handle JWT token or username string
                String principalStr = (String) principal;
                // Try to extract user info from JWT token or username
                if (principalStr.contains("@")) {
                    // It might be an email
                    userName = principalStr;
                    userRole = "CUSTOMER"; // Default role
                }
            } else {
                // Try to extract from JWT token in request header
                try {
                    ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                    if (attributes != null) {
                        HttpServletRequest request = attributes.getRequest();
                        String authHeader = request.getHeader("Authorization");
                        if (authHeader != null && authHeader.startsWith("Bearer ")) {
                            String token = authHeader.substring(7);
                            
                            // Extract user info from JWT token
                            Map<String, Object> userInfo = extractUserInfoFromToken(token);
                            if (userInfo != null) {
                                userId = Long.valueOf(userInfo.get("id").toString());
                                userName = (String) userInfo.get("name");
                                userRole = (String) userInfo.get("roles");
                            }
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error extracting user info from JWT: " + e.getMessage());
                }
                
                if (userName.isEmpty()) {
                    userName = "UNKNOWN";
                    userRole = "UNKNOWN";
                }
            }
        }

        // Get request information
        String ipAddress = "unknown";
        String userAgent = "unknown";
        String sessionId = "unknown";
        String userLocation = "Unknown";

        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                ipAddress = IpLocationUtil.extractClientIp(request);
                userAgent = request.getHeader("User-Agent");
                sessionId = request.getSession().getId();
                userLocation = IpLocationUtil.getUserLocation(ipAddress);
                

            }
        } catch (Exception e) {
            System.err.println("Error getting request info: " + e.getMessage());
        }

        // Extract entity information from method parameters
        String entityId = extractEntityId(joinPoint, logActivity.entityIdParam());
        String entityName = extractEntityName(joinPoint, logActivity.entityNameParam());

        // For DELETE operations, we need to get the entity name from database before deletion
        if (logActivity.actionType().equals("DELETE") && entityId != null) {
            entityName = extractEntityNameFromDatabase(logActivity.entityType(), entityId);
        }
        
        // For CREATE operations, extract entity name from the created entity
        if (logActivity.actionType().equals("CREATE")) {
            entityName = extractEntityNameFromCreateOperation(joinPoint, logActivity.entityType());
        }
        
        // For UPDATE operations, extract entity name from database if not already extracted
        if (logActivity.actionType().equals("UPDATE") && entityId != null && entityName == null) {
            entityName = extractEntityNameFromDatabase(logActivity.entityType(), entityId);
        }

        // Store original state for change tracking - MUST happen BEFORE method execution
        Object originalState = null;
        if (logActivity.logChanges() && logActivity.actionType().equals("UPDATE")) {
            originalState = captureOriginalState(joinPoint, logActivity, entityId);
        }

        Object result = null;
        String status = "SUCCESS";
        String errorMessage = null;
        LocalDateTime endTime = null;

        try {
            // Execute the method
            result = joinPoint.proceed();
            endTime = LocalDateTime.now();

            // Calculate duration
            Duration duration = Duration.between(startTime, endTime);
            long durationMillis = duration.toMillis();

            // Build structured details JSON with duration
            Map<String, Object> detailsMap = new HashMap<>();
            if (entityId != null) detailsMap.put("EntityId", entityId);
            if (entityName != null) detailsMap.put("EntityName", entityName);
            detailsMap.put("Duration", durationMillis + "ms");
            detailsMap.put("StartTime", startTime.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss")));
            detailsMap.put("EndTime", endTime.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss")));
            detailsMap.put("SessionId", sessionId);
            detailsMap.put("Location", userLocation);

            String details = null;
            try {
                details = objectMapper.writeValueAsString(detailsMap);
            } catch (Exception e) {
                details = "Error serializing details: " + e.getMessage();
            }

            // Create activity log
            String description = buildDescription(logActivity, entityName, entityId);
            ActivityLog activityLog = activityLogService.createActivityLog(
                userId, userName, userRole,
                logActivity.actionType(), logActivity.entityType(), entityId,
                description, logActivity.severityLevel(),
                ipAddress, userAgent, sessionId
            );
            activityLog.setDetails(details);

            // Log changes if enabled and it's an update operation
            if (logActivity.logChanges() && logActivity.actionType().equals("UPDATE")) {
                Map<String, Object> changes = captureChanges(originalState, result, logActivity, joinPoint);
                if (!changes.isEmpty()) {
                    try {
                        activityLog.setChanges(objectMapper.writeValueAsString(changes));
                        activityLogService.createActivityLog(activityLog);
                    } catch (JsonProcessingException e) {
                        activityLog.setChanges("Error serializing changes: " + e.getMessage());
                        activityLogService.createActivityLog(activityLog);
                    }
                } else {
                    activityLogService.createActivityLog(activityLog);
                }
            } else {
                activityLogService.createActivityLog(activityLog);
            }

        } catch (Exception e) {
            endTime = LocalDateTime.now();
            status = "FAILED";
            errorMessage = e.getMessage();
            
            // Calculate duration for failed operation
            Duration duration = Duration.between(startTime, endTime);
            long durationMillis = duration.toMillis();

            // Build details for failed operation
            Map<String, Object> detailsMap = new HashMap<>();
            if (entityId != null) detailsMap.put("EntityId", entityId);
            if (entityName != null) detailsMap.put("EntityName", entityName);
            detailsMap.put("Duration", durationMillis + "ms");
            detailsMap.put("StartTime", startTime.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss")));
            detailsMap.put("EndTime", endTime.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss")));
            detailsMap.put("SessionId", sessionId);
            detailsMap.put("Location", userLocation);
            detailsMap.put("Error", errorMessage);

            String details = null;
            try {
                details = objectMapper.writeValueAsString(detailsMap);
            } catch (Exception ex) {
                details = "Error serializing details: " + ex.getMessage();
            }

            // Log the failed activity
            String description = buildDescription(logActivity, entityName, entityId) + " - FAILED";
            ActivityLog activityLog = activityLogService.createActivityLog(
                userId, userName, userRole,
                logActivity.actionType(), logActivity.entityType(), entityId,
                description, "CRITICAL", // Failed operations are critical
                ipAddress, userAgent, sessionId
            );
            activityLog.setStatus(status);
            activityLog.setErrorMessage(errorMessage);
            activityLog.setDetails(details);
            
            // Log changes for failed operations too
            if (logActivity.logChanges() && logActivity.actionType().equals("UPDATE")) {
                Map<String, Object> changes = captureChanges(originalState, null, logActivity, joinPoint);
                if (!changes.isEmpty()) {
                    try {
                        activityLog.setChanges(objectMapper.writeValueAsString(changes));
                    } catch (JsonProcessingException ex) {
                        activityLog.setChanges("Error serializing changes: " + ex.getMessage());
                    }
                }
            }
            
            activityLogService.createActivityLog(activityLog);
            throw e;
        }

        return result;
    }

    // NOTE: For login actions, the user is not authenticated yet when the aspect runs.
    // To log the real user info for login, log manually in the controller after authentication.

    private String extractEntityId(ProceedingJoinPoint joinPoint, String paramName) {
        if (paramName.isEmpty()) {
            return null;
        }

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        for (int i = 0; i < parameterNames.length; i++) {
            if (paramName.equals(parameterNames[i])) {
                return args[i] != null ? args[i].toString() : null;
            }
        }

        return null;
    }

    private String extractEntityName(ProceedingJoinPoint joinPoint, String paramName) {
        if (paramName.isEmpty()) {
            return null;
        }

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        for (int i = 0; i < parameterNames.length; i++) {
            if (paramName.equals(parameterNames[i])) {
                return args[i] != null ? args[i].toString() : null;
            }
        }

        return null;
    }

    private String extractEntityNameFromDatabase(String entityType, String entityId) {
        try {
            Long id = Long.valueOf(entityId);
            
            switch (entityType) {
                case "BRAND":
                    com.Ojt.Ecommerce.entity.Brand brand = brandRepository.findById(id).orElse(null);
                    return brand != null ? brand.getName() : "Unknown Brand (ID: " + id + ")";
                    
                case "CATEGORY":
                    com.Ojt.Ecommerce.entity.Category category = categoryRepository.findById(id).orElse(null);
                    return category != null ? category.getName() : "Unknown Category (ID: " + id + ")";
                    
                case "PRODUCT":
                    com.Ojt.Ecommerce.entity.Product product = productRepository.findById(id).orElse(null);
                    return product != null ? product.getProductName() : "Unknown Product (ID: " + id + ")";
                    
                case "USER":
                    com.Ojt.Ecommerce.entity.User user = userRepository.findById(id).orElse(null);
                    return user != null ? user.getName() : "Unknown User (ID: " + id + ")";
                    
                case "DISCOUNT":
                    com.Ojt.Ecommerce.entity.Discount discount = discountRepository.findById(id).orElse(null);
                    return discount != null ? discount.getName() : "Unknown Discount (ID: " + id + ")";
                    
                case "ORDER":
                    com.Ojt.Ecommerce.entity.UserOrder order = orderRepository.findById(id).orElse(null);
                    return order != null ? "Order #" + order.getId() : "Unknown Order (ID: " + id + ")";
                    
                case "ADDRESS":
                    com.Ojt.Ecommerce.entity.Address address = addressRepository.findById(id).orElse(null);
                    return address != null ? address.getAddress() : "Unknown Address (ID: " + id + ")";
                    
                default:
                    return "Unknown Entity (ID: " + id + ")";
            }
        } catch (Exception e) {
            System.err.println("Error extracting entity name from database: " + e.getMessage());
            return "Error (ID: " + entityId + ")";
        }
    }

    private String extractEntityNameFromCreateOperation(ProceedingJoinPoint joinPoint, String entityType) {
        try {
            Object[] args = joinPoint.getArgs();
            
            switch (entityType) {
                case "BRAND":
                    for (Object arg : args) {
                        if (arg instanceof com.Ojt.Ecommerce.dto.BrandDTO) {
                            com.Ojt.Ecommerce.dto.BrandDTO dto = (com.Ojt.Ecommerce.dto.BrandDTO) arg;
                            return dto.getBrandName() != null ? dto.getBrandName() : "Unknown Brand";
                        }
                    }
                    break;
                    
                case "CATEGORY":
                    for (Object arg : args) {
                        if (arg instanceof com.Ojt.Ecommerce.dto.CategoryDTO) {
                            com.Ojt.Ecommerce.dto.CategoryDTO dto = (com.Ojt.Ecommerce.dto.CategoryDTO) arg;
                            if (dto.getCateNames() != null && !dto.getCateNames().isEmpty()) {
                                return dto.getCateNames().get(0);
                            }
                        }
                    }
                    break;
                    
                case "PRODUCT":
                    for (Object arg : args) {
                        if (arg instanceof com.Ojt.Ecommerce.dto.ProductDTO) {
                            com.Ojt.Ecommerce.dto.ProductDTO dto = (com.Ojt.Ecommerce.dto.ProductDTO) arg;
                            return dto.getProductName() != null ? dto.getProductName() : "Unknown Product";
                        }
                    }
                    break;
                    
                case "USER":
                    for (Object arg : args) {
                        if (arg instanceof com.Ojt.Ecommerce.dto.RegisterRequest) {
                            com.Ojt.Ecommerce.dto.RegisterRequest dto = (com.Ojt.Ecommerce.dto.RegisterRequest) arg;
                            return dto.getName() != null ? dto.getName() : "Unknown User";
                        }
                    }
                    break;
                    
                case "DISCOUNT":
                    for (Object arg : args) {
                        if (arg instanceof com.Ojt.Ecommerce.dto.DiscountRequestDTO) {
                            com.Ojt.Ecommerce.dto.DiscountRequestDTO dto = (com.Ojt.Ecommerce.dto.DiscountRequestDTO) arg;
                            return dto.getName() != null ? dto.getName() : "Unknown Discount";
                        }
                    }
                    break;
                    
                case "ADDRESS":
                    for (Object arg : args) {
                        if (arg instanceof com.Ojt.Ecommerce.dto.AddressDTO) {
                            com.Ojt.Ecommerce.dto.AddressDTO dto = (com.Ojt.Ecommerce.dto.AddressDTO) arg;
                            return dto.getAddress() != null ? dto.getAddress() : "Unknown Address";
                        }
                    }
                    break;
            }
            
            return "Unknown " + entityType;
        } catch (Exception e) {
            System.err.println("Error extracting entity name from create operation: " + e.getMessage());
            return "Unknown " + entityType;
        }
    }

    private Object captureOriginalState(ProceedingJoinPoint joinPoint, LogActivity logActivity, String entityId) {
        try {
            if (logActivity.entityType().equals("USER") && entityId != null) {
                Long id = Long.valueOf(entityId);
                // Force a fresh database query to avoid any caching issues
                System.out.println("=== CAPTURING ORIGINAL STATE ===");
                System.out.println("Fetching user with ID: " + id);
                
                // Use EntityManager to force a fresh query and detach the entity
                try {
                    // Get the EntityManager from the repository
                    User originalUser = userRepository.findById(id).orElse(null);
                    if (originalUser != null) {
                        // Create a deep copy to avoid any JPA managed entity issues
                        User detachedUser = new User();
                        detachedUser.setId(originalUser.getId());
                        detachedUser.setName(originalUser.getName());
                        detachedUser.setEmail(originalUser.getEmail());
                        detachedUser.setPhoneNumber(originalUser.getPhoneNumber());
                        detachedUser.setGender(originalUser.getGender());
                        detachedUser.setDateOfBirth(originalUser.getDateOfBirth());
                        
                        System.out.println("Original user name: '" + detachedUser.getName() + "'");
                        System.out.println("Original user email: '" + detachedUser.getEmail() + "'");
                        System.out.println("Original user phone: '" + detachedUser.getPhoneNumber() + "'");
                        System.out.println("Original user gender: '" + detachedUser.getGender() + "'");
                        System.out.println("Original user dateOfBirth: '" + detachedUser.getDateOfBirth() + "'");
                        System.out.println("User entity state: Detached (ID: " + detachedUser.getId() + ")");
                        
                        return detachedUser;
                    } else {
                        System.out.println("User not found with ID: " + id);
                    }
                    System.out.println("=== END CAPTURING ORIGINAL STATE ===");
                    return null;
                } catch (Exception e) {
                    System.err.println("Error fetching original user: " + e.getMessage());
                    e.printStackTrace();
                    return null;
                }
            }
            if (logActivity.entityType().equals("PRODUCT") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING PRODUCT ORIGINAL STATE ===");
                System.out.println("Fetching product with ID: " + id);
                
                com.Ojt.Ecommerce.entity.Product originalProduct = productRepository.findById(id).orElse(null);
                if (originalProduct != null) {
                    // Create a deep copy to avoid any JPA managed entity issues
                    com.Ojt.Ecommerce.entity.Product detachedProduct = new com.Ojt.Ecommerce.entity.Product();
                    detachedProduct.setId(originalProduct.getId());
                    detachedProduct.setProductName(originalProduct.getProductName());
                    detachedProduct.setProductCode(originalProduct.getProductCode());
                    detachedProduct.setPrice(originalProduct.getPrice());
                    detachedProduct.setQuantity(originalProduct.getQuantity());
                    detachedProduct.setDescription(originalProduct.getDescription());
                    detachedProduct.setStatus(originalProduct.getStatus());
                    detachedProduct.setCreateDate(originalProduct.getCreateDate());
                    detachedProduct.setUpdateDate(originalProduct.getUpdateDate());
                    
                    // Copy brand if exists
                    if (originalProduct.getBrand() != null) {
                        com.Ojt.Ecommerce.entity.Brand detachedBrand = new com.Ojt.Ecommerce.entity.Brand();
                        detachedBrand.setId(originalProduct.getBrand().getId());
                        detachedBrand.setName(originalProduct.getBrand().getName());
                        detachedProduct.setBrand(detachedBrand);
                    }
                    
                    // Copy product categories
                    if (originalProduct.getProductCategories() != null) {
                        java.util.Set<com.Ojt.Ecommerce.entity.ProductHasCategory> detachedCategories = new java.util.HashSet<>();
                        for (com.Ojt.Ecommerce.entity.ProductHasCategory phc : originalProduct.getProductCategories()) {
                            com.Ojt.Ecommerce.entity.ProductHasCategory detachedPhc = new com.Ojt.Ecommerce.entity.ProductHasCategory();
                            detachedPhc.setId(phc.getId());
                            detachedPhc.setProduct(detachedProduct);
                            if (phc.getCategory() != null) {
                                com.Ojt.Ecommerce.entity.Category detachedCategory = new com.Ojt.Ecommerce.entity.Category();
                                detachedCategory.setId(phc.getCategory().getId());
                                detachedCategory.setName(phc.getCategory().getName());
                                detachedPhc.setCategory(detachedCategory);
                            }
                            if (phc.getBrand() != null) {
                                com.Ojt.Ecommerce.entity.Brand detachedPhcBrand = new com.Ojt.Ecommerce.entity.Brand();
                                detachedPhcBrand.setId(phc.getBrand().getId());
                                detachedPhcBrand.setName(phc.getBrand().getName());
                                detachedPhc.setBrand(detachedPhcBrand);
                            }
                            detachedCategories.add(detachedPhc);
                        }
                        detachedProduct.setProductCategories(detachedCategories);
                    }
                    
                    // Copy product variants with their attribute values
                    if (originalProduct.getProductVariants() != null) {
                        java.util.List<com.Ojt.Ecommerce.entity.ProductVariant> detachedVariants = new java.util.ArrayList<>();
                        for (com.Ojt.Ecommerce.entity.ProductVariant variant : originalProduct.getProductVariants()) {
                            com.Ojt.Ecommerce.entity.ProductVariant detachedVariant = new com.Ojt.Ecommerce.entity.ProductVariant();
                            detachedVariant.setId(variant.getId());
                            detachedVariant.setPrice(variant.getPrice());
                            detachedVariant.setStock(variant.getStock());
                            detachedVariant.setStockKeeping(variant.getStockKeeping());
                            detachedVariant.setStatus(variant.getStatus());
                            detachedVariant.setProduct(detachedProduct);
                            
                            // Copy variant attribute values
                            if (variant.getVariantAttributeValues() != null) {
                                java.util.List<com.Ojt.Ecommerce.entity.VariantAttributeValue> detachedVavs = new java.util.ArrayList<>();
                                for (com.Ojt.Ecommerce.entity.VariantAttributeValue vav : variant.getVariantAttributeValues()) {
                                    com.Ojt.Ecommerce.entity.VariantAttributeValue detachedVav = new com.Ojt.Ecommerce.entity.VariantAttributeValue();
                                    detachedVav.setId(vav.getId());
                                    detachedVav.setProductVariant(detachedVariant);
                                    
                                    if (vav.getAttributeValue() != null) {
                                        com.Ojt.Ecommerce.entity.AttributeValue detachedAttrValue = new com.Ojt.Ecommerce.entity.AttributeValue();
                                        detachedAttrValue.setId(vav.getAttributeValue().getId());
                                        detachedAttrValue.setValue(vav.getAttributeValue().getValue());
                                        
                                        if (vav.getAttributeValue().getAttribute() != null) {
                                            com.Ojt.Ecommerce.entity.Attribute detachedAttr = new com.Ojt.Ecommerce.entity.Attribute();
                                            detachedAttr.setId(vav.getAttributeValue().getAttribute().getId());
                                            detachedAttr.setName(vav.getAttributeValue().getAttribute().getName());
                                            detachedAttrValue.setAttribute(detachedAttr);
                                        }
                                        
                                        detachedVav.setAttributeValue(detachedAttrValue);
                                    }
                                    
                                    detachedVavs.add(detachedVav);
                                }
                                detachedVariant.setVariantAttributeValues(detachedVavs);
                            }
                            
                            detachedVariants.add(detachedVariant);
                        }
                        detachedProduct.setProductVariants(detachedVariants);
                    }
                    
                    // Copy product images
                    if (originalProduct.getProductImages() != null) {
                        java.util.List<com.Ojt.Ecommerce.entity.ProductImage> detachedImages = new java.util.ArrayList<>();
                        for (com.Ojt.Ecommerce.entity.ProductImage img : originalProduct.getProductImages()) {
                            com.Ojt.Ecommerce.entity.ProductImage detachedImg = new com.Ojt.Ecommerce.entity.ProductImage();
                            detachedImg.setId(img.getId());
                            detachedImg.setImageUrl(img.getImageUrl());
                            detachedImg.setStatus(img.getStatus());
                            detachedImg.setProduct(detachedProduct);
                            detachedImages.add(detachedImg);
                        }
                        detachedProduct.setProductImages(detachedImages);
                    }
                    
                    System.out.println("Original product name: '" + detachedProduct.getProductName() + "'");
                    System.out.println("Original product price: " + detachedProduct.getPrice());
                    System.out.println("Original product brand: " + (detachedProduct.getBrand() != null ? detachedProduct.getBrand().getName() : "null"));
                    System.out.println("Original product variants count: " + (detachedProduct.getProductVariants() != null ? detachedProduct.getProductVariants().size() : 0));
                    System.out.println("Original product images count: " + (detachedProduct.getProductImages() != null ? detachedProduct.getProductImages().size() : 0));
                    System.out.println("Original product categories count: " + (detachedProduct.getProductCategories() != null ? detachedProduct.getProductCategories().size() : 0));
                    System.out.println("Product entity state: Detached (ID: " + detachedProduct.getId() + ")");
                    System.out.println("=== END CAPTURING PRODUCT ORIGINAL STATE ===");
                    
                    return detachedProduct;
                } else {
                    System.out.println("Product not found with ID: " + id);
                }
                return null;
            }
            if (logActivity.entityType().equals("CATEGORY") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING CATEGORY ORIGINAL STATE ===");
                System.out.println("Fetching category with ID: " + id);
                
                com.Ojt.Ecommerce.entity.Category originalCategory = categoryRepository.findById(id).orElse(null);
                if (originalCategory != null) {
                    // Create a deep copy to avoid any JPA managed entity issues
                    com.Ojt.Ecommerce.entity.Category detachedCategory = new com.Ojt.Ecommerce.entity.Category();
                    detachedCategory.setId(originalCategory.getId());
                    detachedCategory.setName(originalCategory.getName());
                    detachedCategory.setImage(originalCategory.getImage());
                    detachedCategory.setStatus(originalCategory.getStatus());
                    detachedCategory.setIconUrl(originalCategory.getIconUrl());
                    detachedCategory.setIconClass(originalCategory.getIconClass());
                    
                    // Copy parent category if exists
                    if (originalCategory.getParent() != null) {
                        com.Ojt.Ecommerce.entity.Category detachedParent = new com.Ojt.Ecommerce.entity.Category();
                        detachedParent.setId(originalCategory.getParent().getId());
                        detachedParent.setName(originalCategory.getParent().getName());
                        detachedCategory.setParent(detachedParent);
                    }
                    
                    System.out.println("Original category name: '" + detachedCategory.getName() + "'");
                    System.out.println("Original category image: '" + detachedCategory.getImage() + "'");
                    System.out.println("Original category parent: " + (detachedCategory.getParent() != null ? detachedCategory.getParent().getName() : "null"));
                    System.out.println("Category entity state: Detached (ID: " + detachedCategory.getId() + ")");
                    System.out.println("=== END CAPTURING CATEGORY ORIGINAL STATE ===");
                    
                    return detachedCategory;
                } else {
                    System.out.println("Category not found with ID: " + id);
                }
                return null;
            }
            if (logActivity.entityType().equals("BRAND") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING BRAND ORIGINAL STATE ===");
                System.out.println("Fetching brand with ID: " + id);
                
                com.Ojt.Ecommerce.entity.Brand originalBrand = brandRepository.findById(id).orElse(null);
                if (originalBrand != null) {
                    // Create a deep copy to avoid any JPA managed entity issues
                    com.Ojt.Ecommerce.entity.Brand detachedBrand = new com.Ojt.Ecommerce.entity.Brand();
                    detachedBrand.setId(originalBrand.getId());
                    detachedBrand.setName(originalBrand.getName());
                    detachedBrand.setImage(originalBrand.getImage());
                    detachedBrand.setStatus(originalBrand.getStatus());
                    
                    // Copy brand categories
                    if (originalBrand.getBrandCategories() != null) {
                        java.util.List<com.Ojt.Ecommerce.entity.BrandHasCategory> detachedCategories = new java.util.ArrayList<>();
                        for (com.Ojt.Ecommerce.entity.BrandHasCategory bc : originalBrand.getBrandCategories()) {
                            com.Ojt.Ecommerce.entity.BrandHasCategory detachedBc = new com.Ojt.Ecommerce.entity.BrandHasCategory();
                            detachedBc.setId(bc.getId());
                            detachedBc.setBrand(detachedBrand);
                            if (bc.getCategory() != null) {
                                com.Ojt.Ecommerce.entity.Category detachedCategory = new com.Ojt.Ecommerce.entity.Category();
                                detachedCategory.setId(bc.getCategory().getId());
                                detachedCategory.setName(bc.getCategory().getName());
                                detachedBc.setCategory(detachedCategory);
                            }
                            detachedCategories.add(detachedBc);
                        }
                        detachedBrand.setBrandCategories(detachedCategories);
                        System.out.println("Brand has " + detachedCategories.size() + " categories");
                        for (com.Ojt.Ecommerce.entity.BrandHasCategory bc : detachedCategories) {
                            if (bc.getCategory() != null) {
                                System.out.println("Category ID: " + bc.getCategory().getId());
                            }
                        }
                    }
                    
                    System.out.println("Original brand name: '" + detachedBrand.getName() + "'");
                    System.out.println("Original brand image: '" + detachedBrand.getImage() + "'");
                    System.out.println("Original brand status: " + detachedBrand.getStatus());
                    System.out.println("Brand entity state: Detached (ID: " + detachedBrand.getId() + ")");
                    System.out.println("=== END CAPTURING BRAND ORIGINAL STATE ===");
                    
                    return detachedBrand;
                } else {
                    System.out.println("Brand not found with ID: " + id);
                }
                return null;
            }
            if (logActivity.entityType().equals("ADDRESS") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING ADDRESS ORIGINAL STATE ===");
                System.out.println("Fetching address with ID: " + id);
                
                com.Ojt.Ecommerce.entity.Address originalAddress = addressRepository.findById(id).orElse(null);
                if (originalAddress != null) {
                    // Create a deep copy to avoid any JPA managed entity issues
                    com.Ojt.Ecommerce.entity.Address detachedAddress = new com.Ojt.Ecommerce.entity.Address();
                    detachedAddress.setId(originalAddress.getId());
                    detachedAddress.setAddress(originalAddress.getAddress());
                    detachedAddress.setCity(originalAddress.getCity());
                    detachedAddress.setState(originalAddress.getState());
                    detachedAddress.setPostalCode(originalAddress.getPostalCode());
                    detachedAddress.setCountry(originalAddress.getCountry());
                    detachedAddress.setLatitude(originalAddress.getLatitude());
                    detachedAddress.setLongitude(originalAddress.getLongitude());
                    detachedAddress.setType(originalAddress.getType());
                    detachedAddress.setStatus(originalAddress.getStatus());
                    detachedAddress.setCreateUpdate(originalAddress.getCreateUpdate());
                    detachedAddress.setUpdateDate(originalAddress.getUpdateDate());
                    
                    // Copy user if exists
                    if (originalAddress.getUser() != null) {
                        com.Ojt.Ecommerce.entity.User detachedUser = new com.Ojt.Ecommerce.entity.User();
                        detachedUser.setId(originalAddress.getUser().getId());
                        detachedUser.setName(originalAddress.getUser().getName());
                        detachedUser.setEmail(originalAddress.getUser().getEmail());
                        detachedAddress.setUser(detachedUser);
                    }
                    
                    System.out.println("Original address: '" + detachedAddress.getAddress() + "'");
                    System.out.println("Original city: '" + detachedAddress.getCity() + "'");
                    System.out.println("Original state: '" + detachedAddress.getState() + "'");
                    System.out.println("Original postal code: '" + detachedAddress.getPostalCode() + "'");
                    System.out.println("Original country: '" + detachedAddress.getCountry() + "'");
                    System.out.println("Address entity state: Detached (ID: " + detachedAddress.getId() + ")");
                    System.out.println("=== END CAPTURING ADDRESS ORIGINAL STATE ===");
                    
                    return detachedAddress;
                } else {
                    System.out.println("Address not found with ID: " + id);
                }
                return null;
            }
            if (logActivity.entityType().equals("ORDER") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING ORDER ORIGINAL STATE ===");
                System.out.println("Fetching order with ID: " + id);
                
                com.Ojt.Ecommerce.entity.UserOrder originalOrder = orderRepository.findById(id).orElse(null);
                if (originalOrder != null) {
                    // Create a deep copy to avoid any JPA managed entity issues
                    com.Ojt.Ecommerce.entity.UserOrder detachedOrder = new com.Ojt.Ecommerce.entity.UserOrder();
                    detachedOrder.setId(originalOrder.getId());
                    detachedOrder.setOrderCode(originalOrder.getOrderCode());
                    detachedOrder.setOrderDate(originalOrder.getOrderDate());
                    detachedOrder.setUpdatedDate(originalOrder.getUpdatedDate());
                    // Copy user if exists
                    if (originalOrder.getUser() != null) {
                        com.Ojt.Ecommerce.entity.User detachedUser = new com.Ojt.Ecommerce.entity.User();
                        detachedUser.setId(originalOrder.getUser().getId());
                        detachedUser.setName(originalOrder.getUser().getName());
                        detachedUser.setEmail(originalOrder.getUser().getEmail());
                        detachedOrder.setUser(detachedUser);
                    }
                    
                    // Copy order status history
                    if (originalOrder.getOrderStatusHistory() != null) {
                        java.util.List<com.Ojt.Ecommerce.entity.OrderStatus> detachedStatusHistory = new java.util.ArrayList<>();
                        for (com.Ojt.Ecommerce.entity.OrderStatus status : originalOrder.getOrderStatusHistory()) {
                            com.Ojt.Ecommerce.entity.OrderStatus detachedStatus = new com.Ojt.Ecommerce.entity.OrderStatus();
                            detachedStatus.setId(status.getId());
                            detachedStatus.setStatusDate(status.getStatusDate());
                            detachedStatus.setUserOrder(detachedOrder);
                            
                            if (status.getStatus() != null) {
                                com.Ojt.Ecommerce.entity.Status detachedStatusEntity = new com.Ojt.Ecommerce.entity.Status();
                                detachedStatusEntity.setId(status.getStatus().getId());
                                detachedStatusEntity.setName(status.getStatus().getName());
                                detachedStatus.setStatus(detachedStatusEntity);
                            }
                            
                            detachedStatusHistory.add(detachedStatus);
                        }
                        detachedOrder.setOrderStatusHistory(detachedStatusHistory);
                    }
                    
                    // Copy order products for total amount calculation
                    if (originalOrder.getOrderProducts() != null) {
                        java.util.List<com.Ojt.Ecommerce.entity.UserOrderHasProduct> detachedProducts = new java.util.ArrayList<>();
                        for (com.Ojt.Ecommerce.entity.UserOrderHasProduct product : originalOrder.getOrderProducts()) {
                            com.Ojt.Ecommerce.entity.UserOrderHasProduct detachedProduct = new com.Ojt.Ecommerce.entity.UserOrderHasProduct();
                            detachedProduct.setId(product.getId());
                            detachedProduct.setQuantity(product.getQuantity());
                            detachedProduct.setUnitPrice(product.getUnitPrice());
                            detachedProduct.setUserOrder(detachedOrder);
                            
                            // Copy product details if needed
                            if (product.getProduct() != null) {
                                com.Ojt.Ecommerce.entity.Product detachedProductEntity = new com.Ojt.Ecommerce.entity.Product();
                                detachedProductEntity.setId(product.getProduct().getId());
                                detachedProductEntity.setProductName(product.getProduct().getProductName());
                                detachedProduct.setProduct(detachedProductEntity);
                            }
                            
                            detachedProducts.add(detachedProduct);
                        }
                        detachedOrder.setOrderProducts(detachedProducts);
                    }
                    
                    // Calculate total amount from order products
                    double totalAmount = 0.0;
                    if (originalOrder.getOrderProducts() != null) {
                        totalAmount = originalOrder.getOrderProducts().stream()
                                .mapToDouble(product -> product.getQuantity() * product.getUnitPrice().doubleValue())
                                .sum();
                    }
                    
                    // Get current status from order status history
                    String currentStatus = null;
                    if (originalOrder.getOrderStatusHistory() != null && !originalOrder.getOrderStatusHistory().isEmpty()) {
                        com.Ojt.Ecommerce.entity.OrderStatus latestStatus = originalOrder.getOrderStatusHistory().get(originalOrder.getOrderStatusHistory().size() - 1);
                        if (latestStatus.getStatus() != null) {
                            currentStatus = latestStatus.getStatus().getName().name();
                        }
                    }
                    
                    System.out.println("Original order code: '" + detachedOrder.getOrderCode() + "'");
                    System.out.println("Original order date: " + detachedOrder.getOrderDate());
                    System.out.println("Original total amount: " + totalAmount);
                    System.out.println("Original status: " + (currentStatus != null ? currentStatus : "null"));
                    System.out.println("Order status history count: " + (detachedOrder.getOrderStatusHistory() != null ? detachedOrder.getOrderStatusHistory().size() : 0));
                    System.out.println("Order products count: " + (detachedOrder.getOrderProducts() != null ? detachedOrder.getOrderProducts().size() : 0));
                    System.out.println("Order entity state: Detached (ID: " + detachedOrder.getId() + ")");
                    System.out.println("=== END CAPTURING ORDER ORIGINAL STATE ===");
                    
                    return detachedOrder;
                } else {
                    System.out.println("Order not found with ID: " + id);
                }
                return null;
            }
            if (logActivity.entityType().equals("DISCOUNT") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING DISCOUNT ORIGINAL STATE ===");
                System.out.println("Fetching discount with ID: " + id);
                
                com.Ojt.Ecommerce.entity.Discount originalDiscount = discountRepository.findById(id).orElse(null);
                if (originalDiscount != null) {
                    // Create a deep copy to avoid any JPA managed entity issues
                    com.Ojt.Ecommerce.entity.Discount detachedDiscount = new com.Ojt.Ecommerce.entity.Discount();
                    detachedDiscount.setId(originalDiscount.getId());
                    detachedDiscount.setName(originalDiscount.getName());
                    detachedDiscount.setDescription(originalDiscount.getDescription());
                    detachedDiscount.setDiscountType(originalDiscount.getDiscountType());
                    detachedDiscount.setDiscountValue(originalDiscount.getDiscountValue());
                    detachedDiscount.setStartDate(originalDiscount.getStartDate());
                    detachedDiscount.setEndDate(originalDiscount.getEndDate());
                    detachedDiscount.setStatus(originalDiscount.isStatus());
                    detachedDiscount.setCode(originalDiscount.getCode());
                    detachedDiscount.setAutoApply(originalDiscount.getAutoApply());
                    detachedDiscount.setMinimumSpend(originalDiscount.getMinimumSpend());
                    
                    System.out.println("Original discount name: '" + detachedDiscount.getName() + "'");
                    System.out.println("Original discount description: '" + detachedDiscount.getDescription() + "'");
                    System.out.println("Original discount type: " + detachedDiscount.getDiscountType());
                    System.out.println("Original discount value: " + detachedDiscount.getDiscountValue());
                    System.out.println("Original start date: " + detachedDiscount.getStartDate());
                    System.out.println("Original end date: " + detachedDiscount.getEndDate());
                    System.out.println("Original status: " + detachedDiscount.isStatus());
                    System.out.println("Discount entity state: Detached (ID: " + detachedDiscount.getId() + ")");
                    System.out.println("=== END CAPTURING DISCOUNT ORIGINAL STATE ===");
                    
                    return detachedDiscount;
                } else {
                    System.out.println("Discount not found with ID: " + id);
                }
                return null;
            }
            if (logActivity.entityType().equals("RETURN_REQUEST") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING RETURN_REQUEST ORIGINAL STATE ===");
                System.out.println("Fetching return request with ID: " + id);
                
                com.Ojt.Ecommerce.entity.ReturnRequest originalReturnRequest = returnRequestRepository.findById(id).orElse(null);
                if (originalReturnRequest != null) {
                    // Create a deep copy to avoid any JPA managed entity issues
                    com.Ojt.Ecommerce.entity.ReturnRequest detachedReturnRequest = new com.Ojt.Ecommerce.entity.ReturnRequest();
                    detachedReturnRequest.setId(originalReturnRequest.getId());
                    detachedReturnRequest.setReturnDetail(originalReturnRequest.getReturnDetail());
                    detachedReturnRequest.setStatus(originalReturnRequest.getStatus());
                    detachedReturnRequest.setRequestedAt(originalReturnRequest.getRequestedAt());
                    detachedReturnRequest.setAdminRemark(originalReturnRequest.getAdminRemark());
                    
                    // Copy user if exists
                    if (originalReturnRequest.getUser() != null) {
                        com.Ojt.Ecommerce.entity.User detachedUser = new com.Ojt.Ecommerce.entity.User();
                        detachedUser.setId(originalReturnRequest.getUser().getId());
                        detachedUser.setName(originalReturnRequest.getUser().getName());
                        detachedUser.setEmail(originalReturnRequest.getUser().getEmail());
                        detachedReturnRequest.setUser(detachedUser);
                    }
                    
                    // Copy order if exists
                    if (originalReturnRequest.getOrder() != null) {
                        com.Ojt.Ecommerce.entity.UserOrder detachedOrder = new com.Ojt.Ecommerce.entity.UserOrder();
                        detachedOrder.setId(originalReturnRequest.getOrder().getId());
                        detachedOrder.setOrderCode(originalReturnRequest.getOrder().getOrderCode());
                        detachedReturnRequest.setOrder(detachedOrder);
                    }
                    
                    System.out.println("Original return request ID: " + detachedReturnRequest.getId());
                    System.out.println("Original return detail: '" + detachedReturnRequest.getReturnDetail() + "'");
                    System.out.println("Original status: " + detachedReturnRequest.getStatus());
                    System.out.println("Return request entity state: Detached (ID: " + detachedReturnRequest.getId() + ")");
                    System.out.println("=== END CAPTURING RETURN_REQUEST ORIGINAL STATE ===");
                    
                    return detachedReturnRequest;
                } else {
                    System.out.println("Return request not found with ID: " + id);
                }
                return null;
            }
            if (logActivity.entityType().equals("REVIEW") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING REVIEW ORIGINAL STATE ===");
                System.out.println("Fetching review with ID: " + id);
                
                com.Ojt.Ecommerce.entity.Review originalReview = reviewRepository.findById(id).orElse(null);
                if (originalReview != null) {
                    // Create a deep copy to avoid any JPA managed entity issues
                    com.Ojt.Ecommerce.entity.Review detachedReview = new com.Ojt.Ecommerce.entity.Review();
                    detachedReview.setId(originalReview.getId());
                    detachedReview.setRating(originalReview.getRating());
                    detachedReview.setComment(originalReview.getComment());
                    detachedReview.setTimestamp(originalReview.getTimestamp());
                    
                    // Copy user if exists
                    if (originalReview.getUser() != null) {
                        com.Ojt.Ecommerce.entity.User detachedUser = new com.Ojt.Ecommerce.entity.User();
                        detachedUser.setId(originalReview.getUser().getId());
                        detachedUser.setName(originalReview.getUser().getName());
                        detachedUser.setEmail(originalReview.getUser().getEmail());
                        detachedReview.setUser(detachedUser);
                    }
                    
                    // Copy product if exists
                    if (originalReview.getProduct() != null) {
                        com.Ojt.Ecommerce.entity.Product detachedProduct = new com.Ojt.Ecommerce.entity.Product();
                        detachedProduct.setId(originalReview.getProduct().getId());
                        detachedProduct.setProductName(originalReview.getProduct().getProductName());
                        detachedReview.setProduct(detachedProduct);
                    }
                    
                    System.out.println("Original review ID: " + detachedReview.getId());
                    System.out.println("Original rating: " + detachedReview.getRating());
                    System.out.println("Original comment: '" + detachedReview.getComment() + "'");
                    System.out.println("Review entity state: Detached (ID: " + detachedReview.getId() + ")");
                    System.out.println("=== END CAPTURING REVIEW ORIGINAL STATE ===");
                    
                    return detachedReview;
                } else {
                    System.out.println("Review not found with ID: " + id);
                }
                return null;
            }
            if (logActivity.entityType().equals("WISHLIST") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING WISHLIST ORIGINAL STATE ===");
                System.out.println("Fetching wishlist with ID: " + id);
                
                com.Ojt.Ecommerce.entity.Wishlist originalWishlist = wishlistRepository.findById(id).orElse(null);
                if (originalWishlist != null) {
                    // Create a deep copy to avoid any JPA managed entity issues
                    com.Ojt.Ecommerce.entity.Wishlist detachedWishlist = new com.Ojt.Ecommerce.entity.Wishlist();
                    detachedWishlist.setId(originalWishlist.getId());
                    detachedWishlist.setWishlistDate(originalWishlist.getWishlistDate());
                    detachedWishlist.setStatus(originalWishlist.getStatus());
                    
                    // Copy user if exists
                    if (originalWishlist.getUser() != null) {
                        com.Ojt.Ecommerce.entity.User detachedUser = new com.Ojt.Ecommerce.entity.User();
                        detachedUser.setId(originalWishlist.getUser().getId());
                        detachedUser.setName(originalWishlist.getUser().getName());
                        detachedUser.setEmail(originalWishlist.getUser().getEmail());
                        detachedWishlist.setUser(detachedUser);
                    }
                    
                    // Copy product if exists
                    if (originalWishlist.getProduct() != null) {
                        com.Ojt.Ecommerce.entity.Product detachedProduct = new com.Ojt.Ecommerce.entity.Product();
                        detachedProduct.setId(originalWishlist.getProduct().getId());
                        detachedProduct.setProductName(originalWishlist.getProduct().getProductName());
                        detachedWishlist.setProduct(detachedProduct);
                    }
                    
                    System.out.println("Original wishlist ID: " + detachedWishlist.getId());
                    System.out.println("Original wishlist date: " + detachedWishlist.getWishlistDate());
                    System.out.println("Wishlist entity state: Detached (ID: " + detachedWishlist.getId() + ")");
                    System.out.println("=== END CAPTURING WISHLIST ORIGINAL STATE ===");
                    
                    return detachedWishlist;
                } else {
                    System.out.println("Wishlist not found with ID: " + id);
                }
                return null;
            }
            if (logActivity.entityType().equals("EVENT") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING EVENT ORIGINAL STATE ===");
                System.out.println("Fetching event with ID: " + id);
                
                com.Ojt.Ecommerce.entity.Events originalEvent = eventRepository.findById(id).orElse(null);
                if (originalEvent != null) {
                    // Create a deep copy to avoid any JPA managed entity issues
                    com.Ojt.Ecommerce.entity.Events detachedEvent = new com.Ojt.Ecommerce.entity.Events();
                    detachedEvent.setId(originalEvent.getId());
                    detachedEvent.setName(originalEvent.getName());
                    detachedEvent.setDescription(originalEvent.getDescription());
                    detachedEvent.setEventImage(originalEvent.getEventImage());
                    detachedEvent.setStatus(originalEvent.getStatus());
                    detachedEvent.setSlideNo(originalEvent.getSlideNo());
                    detachedEvent.setStartDate(originalEvent.getStartDate());
                    detachedEvent.setEndDate(originalEvent.getEndDate());
                    
                    System.out.println("Original event name: '" + detachedEvent.getName() + "'");
                    System.out.println("Original event description: '" + detachedEvent.getDescription() + "'");
                    System.out.println("Original event image: '" + detachedEvent.getEventImage() + "'");
                    System.out.println("Original event status: " + detachedEvent.getStatus());
                    System.out.println("Event entity state: Detached (ID: " + detachedEvent.getId() + ")");
                    System.out.println("=== END CAPTURING EVENT ORIGINAL STATE ===");
                    
                    return detachedEvent;
                } else {
                    System.out.println("Event not found with ID: " + id);
                }
                return null;
            }
            if (logActivity.entityType().equals("BLACKLIST") && entityId != null) {
                String id = entityId;
                System.out.println("=== CAPTURING BLACKLIST ORIGINAL STATE ===");
                System.out.println("Fetching blacklist entry with ID: " + id);
                
                com.Ojt.Ecommerce.entity.BlacklistEntry originalBlacklistEntry = blacklistRepository.findById(id).orElse(null);
                if (originalBlacklistEntry != null) {
                    // Create a deep copy to avoid any JPA managed entity issues
                    com.Ojt.Ecommerce.entity.BlacklistEntry detachedBlacklistEntry = new com.Ojt.Ecommerce.entity.BlacklistEntry();
                    detachedBlacklistEntry.setId(originalBlacklistEntry.getId());
                    detachedBlacklistEntry.setTargetType(originalBlacklistEntry.getTargetType());
                    detachedBlacklistEntry.setTargetValue(originalBlacklistEntry.getTargetValue());
                    detachedBlacklistEntry.setCategory(originalBlacklistEntry.getCategory());
                    detachedBlacklistEntry.setReason(originalBlacklistEntry.getReason());
                    detachedBlacklistEntry.setRiskLevel(originalBlacklistEntry.getRiskLevel());
                    detachedBlacklistEntry.setStatus(originalBlacklistEntry.getStatus());
                    detachedBlacklistEntry.setAddedDate(originalBlacklistEntry.getAddedDate());
                    detachedBlacklistEntry.setExpiryDate(originalBlacklistEntry.getExpiryDate());
                    detachedBlacklistEntry.setNotes(originalBlacklistEntry.getNotes());
                    
                    System.out.println("Original blacklist entry ID: " + detachedBlacklistEntry.getId());
                    System.out.println("Original target type: '" + detachedBlacklistEntry.getTargetType() + "'");
                    System.out.println("Original target value: '" + detachedBlacklistEntry.getTargetValue() + "'");
                    System.out.println("Original category: '" + detachedBlacklistEntry.getCategory() + "'");
                    System.out.println("Original reason: '" + detachedBlacklistEntry.getReason() + "'");
                    System.out.println("Blacklist entry entity state: Detached (ID: " + detachedBlacklistEntry.getId() + ")");
                    System.out.println("=== END CAPTURING BLACKLIST ORIGINAL STATE ===");
                    
                    return detachedBlacklistEntry;
                } else {
                    System.out.println("Blacklist entry not found with ID: " + id);
                }
                return null;
            }
            if (logActivity.entityType().equals("VIP_TIER") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING VIP_TIER ORIGINAL STATE ===");
                System.out.println("Fetching VIP tier with ID: " + id);
                
                com.Ojt.Ecommerce.entity.VipTier originalVipTier = vipTierRepository.findById(id).orElse(null);
                if (originalVipTier != null) {
                    // Create a deep copy to avoid any JPA managed entity issues
                    com.Ojt.Ecommerce.entity.VipTier detachedVipTier = new com.Ojt.Ecommerce.entity.VipTier();
                    detachedVipTier.setId(originalVipTier.getId());
                    detachedVipTier.setName(originalVipTier.getName());
                    detachedVipTier.setDescription(originalVipTier.getDescription());
                    detachedVipTier.setMinPoints(originalVipTier.getMinPoints());
                    detachedVipTier.setWeight(originalVipTier.getWeight());
                    detachedVipTier.setColor(originalVipTier.getColor());
                    detachedVipTier.setIcon(originalVipTier.getIcon());
                    detachedVipTier.setOrder(originalVipTier.getOrder());
                    
                    System.out.println("Original VIP tier name: '" + detachedVipTier.getName() + "'");
                    System.out.println("Original VIP tier description: '" + detachedVipTier.getDescription() + "'");
                    System.out.println("Original min points: " + detachedVipTier.getMinPoints());
                    System.out.println("Original weight: " + detachedVipTier.getWeight());
                    System.out.println("Original color: " + detachedVipTier.getColor());
                    System.out.println("VIP tier entity state: Detached (ID: " + detachedVipTier.getId() + ")");
                    System.out.println("=== END CAPTURING VIP_TIER ORIGINAL STATE ===");
                    
                    return detachedVipTier;
                } else {
                    System.out.println("VIP tier not found with ID: " + id);
                }
                return null;
            }
            
            // ROLE
            if (logActivity.entityType().equals("ROLE") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING ROLE ORIGINAL STATE ===");
                System.out.println("Fetching role with ID: " + id);
                
                Role originalRole = roleRepository.findById(id).orElse(null);
                if (originalRole != null) {
                    Role detachedRole = new Role();
                    detachedRole.setId(originalRole.getId());
                    detachedRole.setName(originalRole.getName());
                    detachedRole.setLevel(originalRole.getLevel());
                    
                    System.out.println("Original role ID: " + detachedRole.getId());
                    System.out.println("Original role name: '" + detachedRole.getName() + "'");
                    System.out.println("Role entity state: Detached (ID: " + detachedRole.getId() + ")");
                    System.out.println("=== END CAPTURING ROLE ORIGINAL STATE ===");
                    
                    return detachedRole;
                } else {
                    System.out.println("Role not found with ID: " + id);
                }
                return null;
            }
            
            // PERMISSION
            if (logActivity.entityType().equals("PERMISSION") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING PERMISSION ORIGINAL STATE ===");
                System.out.println("Fetching permission with ID: " + id);
                
                Permission originalPermission = permissionRepository.findById(id).orElse(null);
                if (originalPermission != null) {
                    Permission detachedPermission = new Permission();
                    detachedPermission.setId(originalPermission.getId());
                    detachedPermission.setName(originalPermission.getName());
                    detachedPermission.setDescription(originalPermission.getDescription());
                    detachedPermission.setLevel(originalPermission.getLevel());
                    
                    System.out.println("Original permission ID: " + detachedPermission.getId());
                    System.out.println("Original permission name: '" + detachedPermission.getName() + "'");
                    System.out.println("Permission entity state: Detached (ID: " + detachedPermission.getId() + ")");
                    System.out.println("=== END CAPTURING PERMISSION ORIGINAL STATE ===");
                    
                    return detachedPermission;
                } else {
                    System.out.println("Permission not found with ID: " + id);
                }
                return null;
            }
            
            // ADMIN_USER
            if (logActivity.entityType().equals("ADMIN_USER") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING ADMIN_USER ORIGINAL STATE ===");
                System.out.println("Fetching admin user with ID: " + id);
                
                com.Ojt.Ecommerce.entity.User originalAdminUser = adminUserRepository.findById(id).orElse(null);
                if (originalAdminUser != null) {
                    com.Ojt.Ecommerce.entity.User detachedAdminUser = new com.Ojt.Ecommerce.entity.User();
                    detachedAdminUser.setId(originalAdminUser.getId());
                    detachedAdminUser.setName(originalAdminUser.getName());
                    detachedAdminUser.setEmail(originalAdminUser.getEmail());
                    detachedAdminUser.setPhoneNumber(originalAdminUser.getPhoneNumber());
                    detachedAdminUser.setStatus(originalAdminUser.getStatus());
                    
                    System.out.println("Original admin user ID: " + detachedAdminUser.getId());
                    System.out.println("Original admin user name: '" + detachedAdminUser.getName() + "'");
                    System.out.println("Admin user entity state: Detached (ID: " + detachedAdminUser.getId() + ")");
                    System.out.println("=== END CAPTURING ADMIN_USER ORIGINAL STATE ===");
                    
                    return detachedAdminUser;
                } else {
                    System.out.println("Admin user not found with ID: " + id);
                }
                return null;
            }
            
            // ATTRIBUTE
            if (logActivity.entityType().equals("ATTRIBUTE") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING ATTRIBUTE ORIGINAL STATE ===");
                System.out.println("Fetching attribute with ID: " + id);
                
                Attribute originalAttribute = attributeRepository.findById(id).orElse(null);
                if (originalAttribute != null) {
                    Attribute detachedAttribute = new Attribute();
                    detachedAttribute.setId(originalAttribute.getId());
                    detachedAttribute.setName(originalAttribute.getName());
                    detachedAttribute.setStatus(originalAttribute.getStatus());
                    
                    System.out.println("Original attribute ID: " + detachedAttribute.getId());
                    System.out.println("Original attribute name: '" + detachedAttribute.getName() + "'");
                    System.out.println("Attribute entity state: Detached (ID: " + detachedAttribute.getId() + ")");
                    System.out.println("=== END CAPTURING ATTRIBUTE ORIGINAL STATE ===");
                    
                    return detachedAttribute;
                } else {
                    System.out.println("Attribute not found with ID: " + id);
                }
                return null;
            }
            
            // DELIVERY_SERVICE
            if (logActivity.entityType().equals("DELIVERY_SERVICE") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING DELIVERY_SERVICE ORIGINAL STATE ===");
                System.out.println("Fetching delivery service with ID: " + id);
                
                DeliveryService originalDeliveryService = deliveryServiceRepository.findById(id).orElse(null);
                if (originalDeliveryService != null) {
                    DeliveryService detachedDeliveryService = new DeliveryService();
                    detachedDeliveryService.setId(originalDeliveryService.getId());
                    detachedDeliveryService.setName(originalDeliveryService.getName());
                    detachedDeliveryService.setFeePerKm(originalDeliveryService.getFeePerKm());
                    detachedDeliveryService.setPhoneNumber(originalDeliveryService.getPhoneNumber());
                    detachedDeliveryService.setStatus(originalDeliveryService.getStatus());
                    
                    System.out.println("Original delivery service ID: " + detachedDeliveryService.getId());
                    System.out.println("Original delivery service name: '" + detachedDeliveryService.getName() + "'");
                    System.out.println("Delivery service entity state: Detached (ID: " + detachedDeliveryService.getId() + ")");
                    System.out.println("=== END CAPTURING DELIVERY_SERVICE ORIGINAL STATE ===");
                    
                    return detachedDeliveryService;
                } else {
                    System.out.println("Delivery service not found with ID: " + id);
                }
                return null;
            }
            
            // POLICY
            if (logActivity.entityType().equals("POLICY") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING POLICY ORIGINAL STATE ===");
                System.out.println("Fetching policy with ID: " + id);
                
                Policy originalPolicy = policyRepository.findById(id).orElse(null);
                if (originalPolicy != null) {
                    Policy detachedPolicy = new Policy();
                    detachedPolicy.setId(originalPolicy.getId());
                    detachedPolicy.setTitle(originalPolicy.getTitle());
                    detachedPolicy.setContent(originalPolicy.getContent());
                    detachedPolicy.setStatus(originalPolicy.getStatus());
                    
                    System.out.println("Original policy ID: " + detachedPolicy.getId());
                    System.out.println("Original policy title: '" + detachedPolicy.getTitle() + "'");
                    System.out.println("Policy entity state: Detached (ID: " + detachedPolicy.getId() + ")");
                    System.out.println("=== END CAPTURING POLICY ORIGINAL STATE ===");
                    
                    return detachedPolicy;
                } else {
                    System.out.println("Policy not found with ID: " + id);
                }
                return null;
            }
            
            // APPEAL
            if (logActivity.entityType().equals("APPEAL") && entityId != null) {
                String id = entityId;
                System.out.println("=== CAPTURING APPEAL ORIGINAL STATE ===");
                System.out.println("Fetching appeal with ID: " + id);
                
                Appeal originalAppeal = appealRepository.findById(id).orElse(null);
                if (originalAppeal != null) {
                    Appeal detachedAppeal = new Appeal();
                    detachedAppeal.setId(originalAppeal.getId());
                    detachedAppeal.setUserEmail(originalAppeal.getUserEmail());
                    detachedAppeal.setAppealReason(originalAppeal.getAppealReason());
                    detachedAppeal.setAppealDetails(originalAppeal.getAppealDetails());
                    detachedAppeal.setStatus(originalAppeal.getStatus());
                    detachedAppeal.setAdminNotes(originalAppeal.getAdminNotes());
                    
                    System.out.println("Original appeal ID: " + detachedAppeal.getId());
                    System.out.println("Original appeal user email: '" + detachedAppeal.getUserEmail() + "'");
                    System.out.println("Appeal entity state: Detached (ID: " + detachedAppeal.getId() + ")");
                    System.out.println("=== END CAPTURING APPEAL ORIGINAL STATE ===");
                    
                    return detachedAppeal;
                } else {
                    System.out.println("Appeal not found with ID: " + id);
                }
                return null;
            }
            
            // REVENUE_TARGET
            if (logActivity.entityType().equals("REVENUE_TARGET") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING REVENUE_TARGET ORIGINAL STATE ===");
                System.out.println("Fetching revenue target with ID: " + id);
                
                RevenueTarget originalRevenueTarget = revenueTargetRepository.findById(id).orElse(null);
                if (originalRevenueTarget != null) {
                    RevenueTarget detachedRevenueTarget = new RevenueTarget();
                    detachedRevenueTarget.setId(originalRevenueTarget.getId());
                    detachedRevenueTarget.setPeriodType(originalRevenueTarget.getPeriodType());
                    detachedRevenueTarget.setPeriodValue(originalRevenueTarget.getPeriodValue());
                    detachedRevenueTarget.setTargetAmount(originalRevenueTarget.getTargetAmount());
                    
                    System.out.println("Original revenue target ID: " + detachedRevenueTarget.getId());
                    System.out.println("Original revenue target amount: " + detachedRevenueTarget.getTargetAmount());
                    System.out.println("Revenue target entity state: Detached (ID: " + detachedRevenueTarget.getId() + ")");
                    System.out.println("=== END CAPTURING REVENUE_TARGET ORIGINAL STATE ===");
                    
                    return detachedRevenueTarget;
                } else {
                    System.out.println("Revenue target not found with ID: " + id);
                }
                return null;
            }
            
            // NOTIFICATION
            if (logActivity.entityType().equals("NOTIFICATION") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING NOTIFICATION ORIGINAL STATE ===");
                System.out.println("Fetching notification with ID: " + id);
                
                Notification originalNotification = notificationRepository.findById(id).orElse(null);
                if (originalNotification != null) {
                    Notification detachedNotification = new Notification();
                    detachedNotification.setId(originalNotification.getId());
                    detachedNotification.setRecipientEmail(originalNotification.getRecipientEmail());
                    detachedNotification.setMessage(originalNotification.getMessage());
                    detachedNotification.setRead(originalNotification.isRead());
                    detachedNotification.setType(originalNotification.getType());
                    
                    System.out.println("Original notification ID: " + detachedNotification.getId());
                    System.out.println("Original notification recipient: '" + detachedNotification.getRecipientEmail() + "'");
                    System.out.println("Notification entity state: Detached (ID: " + detachedNotification.getId() + ")");
                    System.out.println("=== END CAPTURING NOTIFICATION ORIGINAL STATE ===");
                    
                    return detachedNotification;
                } else {
                    System.out.println("Notification not found with ID: " + id);
                }
                return null;
            }
            
            // CONTACT
            if (logActivity.entityType().equals("CONTACT") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING CONTACT ORIGINAL STATE ===");
                System.out.println("Fetching contact with ID: " + id);
                
                ContactMessage originalContact = contactRepository.findById(id).orElse(null);
                if (originalContact != null) {
                    ContactMessage detachedContact = new ContactMessage();
                    detachedContact.setId(originalContact.getId());
                    detachedContact.setName(originalContact.getName());
                    detachedContact.setEmail(originalContact.getEmail());
                    detachedContact.setSubject(originalContact.getSubject());
                    detachedContact.setMessage(originalContact.getMessage());
                    detachedContact.setSubmittedAt(originalContact.getSubmittedAt());
                    
                    System.out.println("Original contact ID: " + detachedContact.getId());
                    System.out.println("Original contact name: '" + detachedContact.getName() + "'");
                    System.out.println("Contact entity state: Detached (ID: " + detachedContact.getId() + ")");
                    System.out.println("=== END CAPTURING CONTACT ORIGINAL STATE ===");
                    
                    return detachedContact;
                } else {
                    System.out.println("Contact not found with ID: " + id);
                }
                return null;
            }
            
            // NEWSLETTER
            if (logActivity.entityType().equals("NEWSLETTER") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING NEWSLETTER ORIGINAL STATE ===");
                System.out.println("Fetching newsletter with ID: " + id);
                
                NewsLetterSubscriber originalNewsLetter = newsLetterRepository.findById(id).orElse(null);
                if (originalNewsLetter != null) {
                    NewsLetterSubscriber detachedNewsLetter = new NewsLetterSubscriber();
                    detachedNewsLetter.setId(originalNewsLetter.getId());
                    detachedNewsLetter.setEmail(originalNewsLetter.getEmail());
                    
                    System.out.println("Original newsletter ID: " + detachedNewsLetter.getId());
                    System.out.println("Original newsletter email: '" + detachedNewsLetter.getEmail() + "'");
                    System.out.println("Newsletter entity state: Detached (ID: " + detachedNewsLetter.getId() + ")");
                    System.out.println("=== END CAPTURING NEWSLETTER ORIGINAL STATE ===");
                    
                    return detachedNewsLetter;
                } else {
                    System.out.println("Newsletter not found with ID: " + id);
                }
                return null;
            }
            
            // SAVED_CARD
            if (logActivity.entityType().equals("SAVED_CARD") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING SAVED_CARD ORIGINAL STATE ===");
                System.out.println("Fetching saved card with ID: " + id);
                
                SavedCard originalSavedCard = savedCardRepository.findById(id).orElse(null);
                if (originalSavedCard != null) {
                    SavedCard detachedSavedCard = new SavedCard();
                    detachedSavedCard.setId(originalSavedCard.getId());
                    detachedSavedCard.setCardholderName(originalSavedCard.getCardholderName());
                    detachedSavedCard.setCardNumber(originalSavedCard.getCardNumber());
                    detachedSavedCard.setExpiryDate(originalSavedCard.getExpiryDate());
                    detachedSavedCard.setCardBrand(originalSavedCard.getCardBrand());
                    detachedSavedCard.setDefault(originalSavedCard.isDefault());
                    detachedSavedCard.setStatus(originalSavedCard.getStatus());
                    
                    System.out.println("Original saved card ID: " + detachedSavedCard.getId());
                    System.out.println("Original saved card holder: '" + detachedSavedCard.getCardholderName() + "'");
                    System.out.println("Original saved card brand: '" + detachedSavedCard.getCardBrand() + "'");
                    System.out.println("Original saved card expiry: '" + detachedSavedCard.getExpiryDate() + "'");
                    System.out.println("Original saved card isDefault: " + detachedSavedCard.isDefault());
                    System.out.println("Saved card entity state: Detached (ID: " + detachedSavedCard.getId() + ")");
                    System.out.println("=== END CAPTURING SAVED_CARD ORIGINAL STATE ===");
                    
                    return detachedSavedCard;
                } else {
                    System.out.println("Saved card not found with ID: " + id);
                }
                return null;
            }
            

            
            // LOGIN_ATTEMPT
            if (logActivity.entityType().equals("LOGIN_ATTEMPT") && entityId != null) {
                Long id = Long.valueOf(entityId);
                System.out.println("=== CAPTURING LOGIN_ATTEMPT ORIGINAL STATE ===");
                System.out.println("Fetching login attempt with ID: " + id);
                
                LoginAttempt originalLoginAttempt = loginAttemptRepository.findById(id).orElse(null);
                if (originalLoginAttempt != null) {
                    LoginAttempt detachedLoginAttempt = new LoginAttempt();
                    detachedLoginAttempt.setId(originalLoginAttempt.getId());
                    detachedLoginAttempt.setUsername(originalLoginAttempt.getUsername());
                    detachedLoginAttempt.setIpAddress(originalLoginAttempt.getIpAddress());
                    detachedLoginAttempt.setStatus(originalLoginAttempt.getStatus());
                    
                    System.out.println("Original login attempt ID: " + detachedLoginAttempt.getId());
                    System.out.println("Original login attempt username: '" + detachedLoginAttempt.getUsername() + "'");
                    System.out.println("Login attempt entity state: Detached (ID: " + detachedLoginAttempt.getId() + ")");
                    System.out.println("=== END CAPTURING LOGIN_ATTEMPT ORIGINAL STATE ===");
                    
                    return detachedLoginAttempt;
                } else {
                    System.out.println("Login attempt not found with ID: " + id);
                }
                return null;
            }
            

        } catch (Exception e) {
            System.err.println("Error fetching original entity: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    private Map<String, Object> captureChanges(Object originalState, Object newState, LogActivity logActivity, ProceedingJoinPoint joinPoint) {
        Map<String, Object> changes = new HashMap<>();
        try {
            Map<String, Object> beforeChanges = new HashMap<>();
            Map<String, Object> afterChanges = new HashMap<>();
            
            // USER (already implemented)
            if (logActivity.entityType().equals("USER") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.User) {
                com.Ojt.Ecommerce.entity.User beforeUser = (com.Ojt.Ecommerce.entity.User) originalState;
                Object[] args = joinPoint.getArgs();
                
                System.out.println("=== CAPTURE CHANGES DEBUG ===");
                System.out.println("Number of arguments: " + args.length);
                for (int i = 0; i < args.length; i++) {
                    System.out.println("Arg " + i + " type: " + (args[i] != null ? args[i].getClass().getSimpleName() : "null"));
                    System.out.println("Arg " + i + " value: " + args[i]);
                }
                
                // Look for RegisterRequest in method arguments (input DTO)
                com.Ojt.Ecommerce.dto.RegisterRequest request = null;
                for (Object arg : args) {
                    if (arg instanceof com.Ojt.Ecommerce.dto.RegisterRequest) {
                        request = (com.Ojt.Ecommerce.dto.RegisterRequest) arg;
                        System.out.println("Found RegisterRequest input: " + request.getName());
                        break;
                    }
                }
                
                // Also check if newState is a RegisterRequest (return value from service)
                com.Ojt.Ecommerce.dto.RegisterRequest resultRequest = null;
                if (newState instanceof com.Ojt.Ecommerce.dto.RegisterRequest) {
                    resultRequest = (com.Ojt.Ecommerce.dto.RegisterRequest) newState;
                    System.out.println("Found RegisterRequest result: " + resultRequest.getName());
                }
                
                // Use the input request for comparison (this contains the changes that will be applied)
                com.Ojt.Ecommerce.dto.RegisterRequest afterRequest = request;
                
                if (afterRequest != null) {
                    System.out.println("Comparing fields with: " + afterRequest.getName());
                    System.out.println("Before user name: '" + beforeUser.getName() + "'");
                    System.out.println("After request name: '" + afterRequest.getName() + "'");
                    System.out.println("Names equal: " + (afterRequest.getName() != null && afterRequest.getName().equals(beforeUser.getName())));
                    
                    // Compare each field and capture changes
                    if (afterRequest.getName() != null && !afterRequest.getName().equals(beforeUser.getName())) {
                        System.out.println("Name changed from '" + beforeUser.getName() + "' to '" + afterRequest.getName() + "'");
                        beforeChanges.put("name", beforeUser.getName());
                        afterChanges.put("name", afterRequest.getName());
                    }
                    if (afterRequest.getEmail() != null && !afterRequest.getEmail().equals(beforeUser.getEmail())) {
                        System.out.println("Email changed from '" + beforeUser.getEmail() + "' to '" + afterRequest.getEmail() + "'");
                        beforeChanges.put("email", beforeUser.getEmail());
                        afterChanges.put("email", afterRequest.getEmail());
                    }
                    if (afterRequest.getPhoneNumber() != null && !afterRequest.getPhoneNumber().equals(beforeUser.getPhoneNumber())) {
                        System.out.println("Phone changed from '" + beforeUser.getPhoneNumber() + "' to '" + afterRequest.getPhoneNumber() + "'");
                        beforeChanges.put("phoneNumber", beforeUser.getPhoneNumber());
                        afterChanges.put("phoneNumber", afterRequest.getPhoneNumber());
                    }
                    if (afterRequest.getDateOfBirth() != null && !afterRequest.getDateOfBirth().equals(beforeUser.getDateOfBirth())) {
                        System.out.println("DateOfBirth changed from '" + beforeUser.getDateOfBirth() + "' to '" + afterRequest.getDateOfBirth() + "'");
                        beforeChanges.put("dateOfBirth", beforeUser.getDateOfBirth());
                        afterChanges.put("dateOfBirth", afterRequest.getDateOfBirth());
                    }
                    if (afterRequest.getGender() != null && !afterRequest.getGender().equals(beforeUser.getGender())) {
                        System.out.println("Gender changed from '" + beforeUser.getGender() + "' to '" + afterRequest.getGender() + "'");
                        beforeChanges.put("gender", beforeUser.getGender());
                        afterChanges.put("gender", afterRequest.getGender());
                    }
                } else {
                    System.out.println("No RegisterRequest found in arguments or result");
                }
                System.out.println("=== END CAPTURE CHANGES DEBUG ===");
                
                // Simple test to verify comparison logic
                System.out.println("=== COMPARISON TEST ===");
                System.out.println("beforeUser.getName(): '" + beforeUser.getName() + "'");
                System.out.println("afterRequest.getName(): '" + afterRequest.getName() + "'");
                System.out.println("beforeUser.getName().equals(afterRequest.getName()): " + beforeUser.getName().equals(afterRequest.getName()));
                System.out.println("!beforeUser.getName().equals(afterRequest.getName()): " + !beforeUser.getName().equals(afterRequest.getName()));
                System.out.println("=== END COMPARISON TEST ===");
            }
            // PRODUCT - COMPREHENSIVE CHANGE TRACKING
            if (logActivity.entityType().equals("PRODUCT") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.Product) {
                try {
                com.Ojt.Ecommerce.entity.Product beforeProduct = (com.Ojt.Ecommerce.entity.Product) originalState;
                Object[] args = joinPoint.getArgs();
                    
                    System.out.println("=== PRODUCT UPDATE DEBUG ===");
                    System.out.println("Before product name: '" + beforeProduct.getProductName() + "'");
                    System.out.println("Before product price: " + beforeProduct.getPrice());
                    System.out.println("Before product variants count: " + (beforeProduct.getProductVariants() != null ? beforeProduct.getProductVariants().size() : 0));
                    System.out.println("Before product images count: " + (beforeProduct.getProductImages() != null ? beforeProduct.getProductImages().size() : 0));
                    System.out.println("=== END PRODUCT UPDATE DEBUG ===");
                    
                    // Extract the updated product from ResponseEntity
                    com.Ojt.Ecommerce.entity.Product updatedProduct = null;
                    if (newState instanceof org.springframework.http.ResponseEntity) {
                        org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                        Object responseBody = responseEntity.getBody();
                        if (responseBody instanceof com.Ojt.Ecommerce.entity.Product) {
                            updatedProduct = (com.Ojt.Ecommerce.entity.Product) responseBody;
                            System.out.println("=== PRODUCT ENTITY EXTRACTED ===");
                            System.out.println("Updated product name: '" + updatedProduct.getProductName() + "'");
                            System.out.println("Updated product price: " + updatedProduct.getPrice());
                            System.out.println("Updated product variants count: " + (updatedProduct.getProductVariants() != null ? updatedProduct.getProductVariants().size() : 0));
                            System.out.println("Updated product images count: " + (updatedProduct.getProductImages() != null ? updatedProduct.getProductImages().size() : 0));
                            System.out.println("=== END PRODUCT ENTITY EXTRACTED ===");
                        }
                    }
                    
                    // Compare basic fields
                    if (updatedProduct != null) {
                        // Product name
                        if (!updatedProduct.getProductName().equals(beforeProduct.getProductName())) {
                            beforeChanges.put("productName", beforeProduct.getProductName());
                            afterChanges.put("productName", updatedProduct.getProductName());
                        }
                        
                        // Product code
                        if (!updatedProduct.getProductCode().equals(beforeProduct.getProductCode())) {
                            beforeChanges.put("productCode", beforeProduct.getProductCode());
                            afterChanges.put("productCode", updatedProduct.getProductCode());
                        }
                        
                        // Price
                        if (!updatedProduct.getPrice().equals(beforeProduct.getPrice())) {
                            beforeChanges.put("price", beforeProduct.getPrice());
                            afterChanges.put("price", updatedProduct.getPrice());
                        }
                        
                        // Quantity
                        if (!updatedProduct.getQuantity().equals(beforeProduct.getQuantity())) {
                            beforeChanges.put("quantity", beforeProduct.getQuantity());
                            afterChanges.put("quantity", updatedProduct.getQuantity());
                        }
                        
                        // Description
                        if (!updatedProduct.getDescription().equals(beforeProduct.getDescription())) {
                            beforeChanges.put("description", beforeProduct.getDescription());
                            afterChanges.put("description", updatedProduct.getDescription());
                        }
                        
                        // Status
                        if (!updatedProduct.getStatus().equals(beforeProduct.getStatus())) {
                            beforeChanges.put("status", beforeProduct.getStatus());
                            afterChanges.put("status", updatedProduct.getStatus());
                        }
                        
                        // Brand
                        String beforeBrandName = beforeProduct.getBrand() != null ? beforeProduct.getBrand().getName() : "No brand";
                        String afterBrandName = updatedProduct.getBrand() != null ? updatedProduct.getBrand().getName() : "No brand";
                        if (!beforeBrandName.equals(afterBrandName)) {
                            beforeChanges.put("brand", beforeBrandName);
                            afterChanges.put("brand", afterBrandName);
                        }
                        
                        // Categories
                        java.util.List<String> beforeCategoryNames = new java.util.ArrayList<>();
                        if (beforeProduct.getProductCategories() != null && !beforeProduct.getProductCategories().isEmpty()) {
                            for (com.Ojt.Ecommerce.entity.ProductHasCategory phc : beforeProduct.getProductCategories()) {
                                if (phc.getCategory() != null) {
                                    beforeCategoryNames.add(phc.getCategory().getName());
                                }
                            }
                        } else {
                            beforeCategoryNames.add("No categories");
                        }
                        
                        java.util.List<String> afterCategoryNames = new java.util.ArrayList<>();
                        if (updatedProduct.getProductCategories() != null && !updatedProduct.getProductCategories().isEmpty()) {
                            for (com.Ojt.Ecommerce.entity.ProductHasCategory phc : updatedProduct.getProductCategories()) {
                                if (phc.getCategory() != null) {
                                    afterCategoryNames.add(phc.getCategory().getName());
                                }
                            }
                        } else {
                            afterCategoryNames.add("No categories");
                        }
                        
                        if (!beforeCategoryNames.equals(afterCategoryNames)) {
                            beforeChanges.put("categories", beforeCategoryNames);
                            afterChanges.put("categories", afterCategoryNames);
                        }
                        
                        // Variants
                        java.util.List<String> beforeVariantInfo = new java.util.ArrayList<>();
                        if (beforeProduct.getProductVariants() != null && !beforeProduct.getProductVariants().isEmpty()) {
                            System.out.println("=== BEFORE VARIANTS DEBUG ===");
                            System.out.println("Before variants count: " + beforeProduct.getProductVariants().size());
                            for (com.Ojt.Ecommerce.entity.ProductVariant variant : beforeProduct.getProductVariants()) {
                                StringBuilder variantInfo = new StringBuilder();
                                variantInfo.append("SKU: ").append(variant.getStockKeeping())
                                          .append(", Price: ").append(variant.getPrice())
                                          .append(", Stock: ").append(variant.getStock());
                                
                                if (variant.getVariantAttributeValues() != null && !variant.getVariantAttributeValues().isEmpty()) {
                                    variantInfo.append(", Attributes: ");
                                    for (com.Ojt.Ecommerce.entity.VariantAttributeValue vav : variant.getVariantAttributeValues()) {
                                        if (vav.getAttributeValue() != null && vav.getAttributeValue().getAttribute() != null) {
                                            variantInfo.append(vav.getAttributeValue().getAttribute().getName())
                                                      .append("=").append(vav.getAttributeValue().getValue()).append(", ");
                                        }
                                    }
                                    // Remove trailing comma and space
                                    if (variantInfo.toString().endsWith(", ")) {
                                        variantInfo.setLength(variantInfo.length() - 2);
                                    }
                                }
                                String variantString = variantInfo.toString();
                                beforeVariantInfo.add(variantString);
                                System.out.println("Before variant: " + variantString);
                            }
                            System.out.println("=== END BEFORE VARIANTS DEBUG ===");
                        } else {
                            beforeVariantInfo.add("No variants");
                        }
                        
                        java.util.List<String> afterVariantInfo = new java.util.ArrayList<>();
                        if (updatedProduct.getProductVariants() != null && !updatedProduct.getProductVariants().isEmpty()) {
                            System.out.println("=== AFTER VARIANTS DEBUG ===");
                            System.out.println("After variants count: " + updatedProduct.getProductVariants().size());
                            for (com.Ojt.Ecommerce.entity.ProductVariant variant : updatedProduct.getProductVariants()) {
                                StringBuilder variantInfo = new StringBuilder();
                                variantInfo.append("SKU: ").append(variant.getStockKeeping())
                                          .append(", Price: ").append(variant.getPrice())
                                          .append(", Stock: ").append(variant.getStock());
                                
                                if (variant.getVariantAttributeValues() != null && !variant.getVariantAttributeValues().isEmpty()) {
                                    variantInfo.append(", Attributes: ");
                                    for (com.Ojt.Ecommerce.entity.VariantAttributeValue vav : variant.getVariantAttributeValues()) {
                                        if (vav.getAttributeValue() != null && vav.getAttributeValue().getAttribute() != null) {
                                            variantInfo.append(vav.getAttributeValue().getAttribute().getName())
                                                      .append("=").append(vav.getAttributeValue().getValue()).append(", ");
                                        }
                                    }
                                    // Remove trailing comma and space
                                    if (variantInfo.toString().endsWith(", ")) {
                                        variantInfo.setLength(variantInfo.length() - 2);
                                    }
                                }
                                String variantString = variantInfo.toString();
                                afterVariantInfo.add(variantString);
                                System.out.println("After variant: " + variantString);
                            }
                            System.out.println("=== END AFTER VARIANTS DEBUG ===");
                        } else {
                            afterVariantInfo.add("No variants");
                        }
                        
                        // Remove duplicates from afterVariantInfo as a safeguard
                        java.util.List<String> uniqueAfterVariantInfo = new java.util.ArrayList<>();
                        java.util.Set<String> seenVariants = new java.util.HashSet<>();
                        for (String variantInfo : afterVariantInfo) {
                            if (!seenVariants.contains(variantInfo)) {
                                uniqueAfterVariantInfo.add(variantInfo);
                                seenVariants.add(variantInfo);
                            }
                        }
                        
                        System.out.println("=== VARIANT COMPARISON DEBUG ===");
                        System.out.println("Before variants: " + beforeVariantInfo);
                        System.out.println("After variants (with duplicates): " + afterVariantInfo);
                        System.out.println("After variants (unique): " + uniqueAfterVariantInfo);
                        System.out.println("=== END VARIANT COMPARISON DEBUG ===");
                        
                        if (!beforeVariantInfo.equals(uniqueAfterVariantInfo)) {
                            beforeChanges.put("variants", beforeVariantInfo);
                            afterChanges.put("variants", uniqueAfterVariantInfo);
                        }
                        
                        // Images
                        java.util.List<String> beforeImageUrls = new java.util.ArrayList<>();
                        if (beforeProduct.getProductImages() != null && !beforeProduct.getProductImages().isEmpty()) {
                            for (com.Ojt.Ecommerce.entity.ProductImage img : beforeProduct.getProductImages()) {
                                if (img.getStatus() == 1) {
                                    beforeImageUrls.add(img.getImageUrl());
                                }
                            }
                        }
                        if (beforeImageUrls.isEmpty()) {
                            beforeImageUrls.add("No images");
                        }
                        
                        java.util.List<String> afterImageUrls = new java.util.ArrayList<>();
                        if (updatedProduct.getProductImages() != null && !updatedProduct.getProductImages().isEmpty()) {
                            for (com.Ojt.Ecommerce.entity.ProductImage img : updatedProduct.getProductImages()) {
                                if (img.getStatus() == 1) {
                                    afterImageUrls.add(img.getImageUrl());
                                }
                            }
                        }
                        if (afterImageUrls.isEmpty()) {
                            afterImageUrls.add("No images");
                        }
                        
                        if (!beforeImageUrls.equals(afterImageUrls)) {
                            beforeChanges.put("images", beforeImageUrls);
                            afterChanges.put("images", afterImageUrls);
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error capturing Product changes: " + e.getMessage());
                    e.printStackTrace();
                }
            }
            
            // CATEGORY
            if (logActivity.entityType().equals("CATEGORY") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.Category) {
                com.Ojt.Ecommerce.entity.Category beforeCategory = (com.Ojt.Ecommerce.entity.Category) originalState;
                Object[] args = joinPoint.getArgs();
                
                System.out.println("=== CATEGORY UPDATE DEBUG ===");
                System.out.println("Before category name: '" + beforeCategory.getName() + "'");
                System.out.println("Before category image: '" + beforeCategory.getImage() + "'");
                System.out.println("NewState type: " + (newState != null ? newState.getClass().getSimpleName() : "null"));
                System.out.println("NewState is Category: " + (newState instanceof com.Ojt.Ecommerce.entity.Category));
                System.out.println("=== END CATEGORY UPDATE DEBUG ===");
                

                
                // Extract parameters from method arguments (Category updates use individual parameters, not DTO)
                String newName = null;
                Long newParentId = null;
                
                // Extract parameters by position (CategoryController.updateCategory method signature)
                // public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestPart("name") String name, @RequestPart(value = "parentId", required = false) Long parentId, @RequestPart(value = "image", required = false) MultipartFile imageFile)
                if (args.length >= 4) {
                    // Arg[0] = id (Long) - category ID
                    // Arg[1] = name (String) - category name
                    // Arg[2] = parentId (Long) - parent category ID (can be null)
                    // Arg[3] = imageFile (MultipartFile) - image file (can be null)
                    
                    if (args[1] instanceof String) {
                        newName = (String) args[1];
                    }
                    if (args[2] instanceof Long) {
                        newParentId = (Long) args[2];
                    }
                }
                
                for (Object arg : args) {
                    if (arg instanceof com.Ojt.Ecommerce.dto.CategoryDTO) {
                        // Handle DTO case if it exists
                        com.Ojt.Ecommerce.dto.CategoryDTO dto = (com.Ojt.Ecommerce.dto.CategoryDTO) arg;
                        
                        // Check name changes
                        if (dto.getCateNames() != null && !dto.getCateNames().isEmpty()) {
                            String dtoName = dto.getCateNames().get(0);
                            if (dtoName != null && !dtoName.equals(beforeCategory.getName())) {
                                beforeChanges.put("name", beforeCategory.getName());
                                afterChanges.put("name", dtoName);
                            }
                        }
                        
                        // Parent category changes are disabled for now to avoid false positives
                        // Only name changes are tracked for Category DTO updates
                    }
                }
                

                
                // Check name changes from individual parameters
                System.out.println("=== CATEGORY NAME CHANGE DEBUG ===");
                System.out.println("Extracted newName: '" + newName + "'");
                System.out.println("Before category name: '" + beforeCategory.getName() + "'");
                System.out.println("Name change detected: " + (newName != null && !newName.equals(beforeCategory.getName())));
                System.out.println("=== END CATEGORY NAME CHANGE DEBUG ===");
                
                if (newName != null && !newName.equals(beforeCategory.getName())) {
                    beforeChanges.put("name", beforeCategory.getName());
                    afterChanges.put("name", newName);
                }
                
                // Extract the actual Category entity from ResponseEntity
                com.Ojt.Ecommerce.entity.Category updatedCategory = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof com.Ojt.Ecommerce.entity.Category) {
                        updatedCategory = (com.Ojt.Ecommerce.entity.Category) responseBody;
                        System.out.println("=== CATEGORY ENTITY EXTRACTED ===");
                        System.out.println("Updated category name: '" + updatedCategory.getName() + "'");
                        System.out.println("Updated category image: '" + updatedCategory.getImage() + "'");
                        System.out.println("=== END CATEGORY ENTITY EXTRACTED ===");
                    }
                }
                
                // Also check name changes from the extracted entity as fallback
                if (updatedCategory != null) {
                    String finalName = updatedCategory.getName();
                    if (finalName != null && !finalName.equals(beforeCategory.getName())) {
                        // Only add if not already added from parameters
                        if (!beforeChanges.containsKey("name")) {
                            beforeChanges.put("name", beforeCategory.getName());
                            afterChanges.put("name", finalName);
                        }
                    }
                }
                
                // Parent category changes are disabled for now to avoid false positives
                // Only name and image changes are tracked for Category updates
                
                // Check image changes from the extracted entity
                if (updatedCategory != null) {
                    String newImagePath = updatedCategory.getImage();
                    String beforeImagePath = beforeCategory.getImage();
                    
                    // Debug logging for image changes
                    System.out.println("=== CATEGORY IMAGE CHANGE DEBUG ===");
                    System.out.println("Before image path: '" + beforeImagePath + "'");
                    System.out.println("After image path: '" + newImagePath + "'");
                    System.out.println("Image changed: " + ((newImagePath != null && !newImagePath.equals(beforeImagePath)) || (newImagePath == null && beforeImagePath != null)));
                    System.out.println("=== END CATEGORY IMAGE CHANGE DEBUG ===");
                    
                    // Detect any image change (new image, removed image, or changed image)
                    if ((newImagePath != null && !newImagePath.equals(beforeImagePath)) || 
                        (newImagePath == null && beforeImagePath != null)) {
                        beforeChanges.put("image", beforeImagePath);
                        afterChanges.put("image", newImagePath);
                    }
                }
            }
            // BRAND
            if (logActivity.entityType().equals("BRAND") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.Brand) {
                com.Ojt.Ecommerce.entity.Brand beforeBrand = (com.Ojt.Ecommerce.entity.Brand) originalState;
                Object[] args = joinPoint.getArgs();
                

                
                for (Object arg : args) {
                    if (arg instanceof com.Ojt.Ecommerce.dto.BrandDTO) {
                        com.Ojt.Ecommerce.dto.BrandDTO dto = (com.Ojt.Ecommerce.dto.BrandDTO) arg;
                        
                        // Check brand name changes (Brand entity uses 'name', DTO uses 'brandName')
                        if (dto.getBrandName() != null && !dto.getBrandName().equals(beforeBrand.getName())) {
                            beforeChanges.put("name", beforeBrand.getName());
                            afterChanges.put("name", dto.getBrandName());
                        }
                        
                        // Check image changes
                        String beforeImagePath = beforeBrand.getImage();
                        String afterImagePath = dto.getImage();
                        if ((afterImagePath != null && !afterImagePath.equals(beforeImagePath)) || 
                            (afterImagePath == null && beforeImagePath != null)) {
                            beforeChanges.put("image", beforeImagePath);
                            afterChanges.put("image", afterImagePath);
                        }
                        
                        // Compare category IDs
                        java.util.Set<Long> beforeCategoryIds = new java.util.HashSet<>();
                        if (beforeBrand.getBrandCategories() != null) {
                            for (com.Ojt.Ecommerce.entity.BrandHasCategory bc : beforeBrand.getBrandCategories()) {
                                if (bc.getCategory() != null) beforeCategoryIds.add(bc.getCategory().getId());
                            }
                        }
                        java.util.Set<Long> afterCategoryIds = new java.util.HashSet<>();
                        if (dto.getCategoryIds() != null) {
                            afterCategoryIds.addAll(dto.getCategoryIds());
                        }
                        
                        if (!beforeCategoryIds.equals(afterCategoryIds)) {
                            
                            // Convert category IDs to category names for better readability
                            java.util.List<String> beforeCategoryNames = new java.util.ArrayList<>();
                            if (beforeCategoryIds.isEmpty()) {
                                beforeCategoryNames.add("No categories");
                            } else {
                                for (Long categoryId : beforeCategoryIds) {
                                    com.Ojt.Ecommerce.entity.Category category = categoryRepository.findById(categoryId).orElse(null);
                                    if (category != null) {
                                        beforeCategoryNames.add(category.getName());
                                    } else {
                                        beforeCategoryNames.add("Unknown Category (ID: " + categoryId + ")");
                                    }
                                }
                            }
                            
                            java.util.List<String> afterCategoryNames = new java.util.ArrayList<>();
                            if (afterCategoryIds.isEmpty()) {
                                afterCategoryNames.add("No categories");
                            } else {
                                for (Long categoryId : afterCategoryIds) {
                                    com.Ojt.Ecommerce.entity.Category category = categoryRepository.findById(categoryId).orElse(null);
                                    if (category != null) {
                                        afterCategoryNames.add(category.getName());
                                    } else {
                                        afterCategoryNames.add("Unknown Category (ID: " + categoryId + ")");
                                    }
                                }
                            }
                            
                            beforeChanges.put("categories", beforeCategoryNames);
                            afterChanges.put("categories", afterCategoryNames);
                        }
                        

                    }
                }
            }
            // ADDRESS
            if (logActivity.entityType().equals("ADDRESS") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.Address) {
                com.Ojt.Ecommerce.entity.Address beforeAddress = (com.Ojt.Ecommerce.entity.Address) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual Address entity from ResponseEntity
                com.Ojt.Ecommerce.entity.Address updatedAddress = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof com.Ojt.Ecommerce.entity.Address) {
                        updatedAddress = (com.Ojt.Ecommerce.entity.Address) responseBody;
                        System.out.println("=== ADDRESS ENTITY EXTRACTED ===");
                        System.out.println("Updated address: '" + updatedAddress.getAddress() + "'");
                        System.out.println("Updated city: '" + updatedAddress.getCity() + "'");
                        System.out.println("Updated state: '" + updatedAddress.getState() + "'");
                        System.out.println("=== END ADDRESS ENTITY EXTRACTED ===");
                    }
                }
                
                for (Object arg : args) {
                    if (arg instanceof com.Ojt.Ecommerce.dto.AddressDTO) {
                        com.Ojt.Ecommerce.dto.AddressDTO dto = (com.Ojt.Ecommerce.dto.AddressDTO) arg;
                        if (dto.getAddress() != null && !dto.getAddress().equals(beforeAddress.getAddress())) {
                            beforeChanges.put("address", beforeAddress.getAddress());
                            afterChanges.put("address", dto.getAddress());
                        }
                        if (dto.getCity() != null && !dto.getCity().equals(beforeAddress.getCity())) {
                            beforeChanges.put("city", beforeAddress.getCity());
                            afterChanges.put("city", dto.getCity());
                        }
                        if (dto.getState() != null && !dto.getState().equals(beforeAddress.getState())) {
                            beforeChanges.put("state", beforeAddress.getState());
                            afterChanges.put("state", dto.getState());
                        }
                        if (dto.getPostalCode() != null && !dto.getPostalCode().equals(beforeAddress.getPostalCode())) {
                            beforeChanges.put("postalCode", beforeAddress.getPostalCode());
                            afterChanges.put("postalCode", dto.getPostalCode());
                        }
                        if (dto.getCountry() != null && !dto.getCountry().equals(beforeAddress.getCountry())) {
                            beforeChanges.put("country", beforeAddress.getCountry());
                            afterChanges.put("country", dto.getCountry());
                        }
                        if (dto.getLatitude() != null && !dto.getLatitude().equals(beforeAddress.getLatitude())) {
                            beforeChanges.put("latitude", beforeAddress.getLatitude());
                            afterChanges.put("latitude", dto.getLatitude());
                        }
                        if (dto.getLongitude() != null && !dto.getLongitude().equals(beforeAddress.getLongitude())) {
                            beforeChanges.put("longitude", beforeAddress.getLongitude());
                            afterChanges.put("longitude", dto.getLongitude());
                        }
                        if (dto.getType() != null && !dto.getType().equals(beforeAddress.getType())) {
                            beforeChanges.put("type", beforeAddress.getType());
                            afterChanges.put("type", dto.getType());
                        }
                        if (dto.getUserId() != null && (beforeAddress.getUser() == null || !dto.getUserId().equals(beforeAddress.getUser().getId()))) {
                            beforeChanges.put("userId", beforeAddress.getUser() != null ? beforeAddress.getUser().getId() : null);
                            afterChanges.put("userId", dto.getUserId());
                        }
                        if (dto.getCreateUpdate() != null && !dto.getCreateUpdate().equals(beforeAddress.getCreateUpdate())) {
                            beforeChanges.put("createUpdate", beforeAddress.getCreateUpdate());
                            afterChanges.put("createUpdate", dto.getCreateUpdate());
                        }
                        if (dto.getUpdateDate() != null && !dto.getUpdateDate().equals(beforeAddress.getUpdateDate())) {
                            beforeChanges.put("updateDate", beforeAddress.getUpdateDate());
                            afterChanges.put("updateDate", dto.getUpdateDate());
                        }
                        // Status (if present in DTO)
                        if (beforeAddress.getStatus() != null && dto instanceof com.Ojt.Ecommerce.dto.AddressDTO) {
                            Integer dtoStatus = null;
                            try {
                                java.lang.reflect.Field statusField = dto.getClass().getDeclaredField("status");
                                statusField.setAccessible(true);
                                dtoStatus = (Integer) statusField.get(dto);
                            } catch (Exception ignored) {}
                            if (dtoStatus != null && !dtoStatus.equals(beforeAddress.getStatus())) {
                                beforeChanges.put("status", beforeAddress.getStatus());
                                afterChanges.put("status", dtoStatus);
                            }
                        }
                    }
                }
                
                // Also check changes from the extracted entity as fallback
                if (updatedAddress != null) {
                    if (updatedAddress.getAddress() != null && !updatedAddress.getAddress().equals(beforeAddress.getAddress())) {
                        if (!beforeChanges.containsKey("address")) {
                            beforeChanges.put("address", beforeAddress.getAddress());
                            afterChanges.put("address", updatedAddress.getAddress());
                        }
                    }
                    if (updatedAddress.getCity() != null && !updatedAddress.getCity().equals(beforeAddress.getCity())) {
                        if (!beforeChanges.containsKey("city")) {
                            beforeChanges.put("city", beforeAddress.getCity());
                            afterChanges.put("city", updatedAddress.getCity());
                        }
                    }
                    if (updatedAddress.getState() != null && !updatedAddress.getState().equals(beforeAddress.getState())) {
                        if (!beforeChanges.containsKey("state")) {
                            beforeChanges.put("state", beforeAddress.getState());
                            afterChanges.put("state", updatedAddress.getState());
                        }
                    }
                    if (updatedAddress.getPostalCode() != null && !updatedAddress.getPostalCode().equals(beforeAddress.getPostalCode())) {
                        if (!beforeChanges.containsKey("postalCode")) {
                            beforeChanges.put("postalCode", beforeAddress.getPostalCode());
                            afterChanges.put("postalCode", updatedAddress.getPostalCode());
                        }
                    }
                    if (updatedAddress.getCountry() != null && !updatedAddress.getCountry().equals(beforeAddress.getCountry())) {
                        if (!beforeChanges.containsKey("country")) {
                            beforeChanges.put("country", beforeAddress.getCountry());
                            afterChanges.put("country", updatedAddress.getCountry());
                        }
                    }
                }
            }
            
            // ORDER
            if (logActivity.entityType().equals("ORDER") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.UserOrder) {
                com.Ojt.Ecommerce.entity.UserOrder beforeOrder = (com.Ojt.Ecommerce.entity.UserOrder) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual Order entity from ResponseEntity
                com.Ojt.Ecommerce.entity.UserOrder updatedOrder = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof com.Ojt.Ecommerce.entity.UserOrder) {
                        updatedOrder = (com.Ojt.Ecommerce.entity.UserOrder) responseBody;
                        
                        // Calculate total amount from order products
                        double totalAmount = 0.0;
                        if (updatedOrder.getOrderProducts() != null) {
                            totalAmount = updatedOrder.getOrderProducts().stream()
                                    .mapToDouble(product -> product.getQuantity() * product.getUnitPrice().doubleValue())
                                    .sum();
                        }
                        
                        System.out.println("=== ORDER ENTITY EXTRACTED ===");
                        System.out.println("Updated order code: '" + updatedOrder.getOrderCode() + "'");
                        System.out.println("Updated order date: " + updatedOrder.getOrderDate());
                        System.out.println("Updated total amount: " + totalAmount);
                        System.out.println("=== END ORDER ENTITY EXTRACTED ===");
                    }
                }
                
                // Get the current (before) status from orderStatusHistory
                        String beforeStatus = null;
                        if (beforeOrder.getOrderStatusHistory() != null && !beforeOrder.getOrderStatusHistory().isEmpty()) {
                    // Sort by status date to get the latest status
                    java.util.List<com.Ojt.Ecommerce.entity.OrderStatus> sortedHistory = new java.util.ArrayList<>(beforeOrder.getOrderStatusHistory());
                    sortedHistory.sort((s1, s2) -> s2.getStatusDate().compareTo(s1.getStatusDate()));
                    com.Ojt.Ecommerce.entity.Status statusObj = sortedHistory.get(0).getStatus();
                            beforeStatus = statusObj != null ? statusObj.getName().name() : null;
                        }
                
                // Look for status change in request parameters
                String newStatus = null;
                for (Object arg : args) {
                    if (arg instanceof java.util.Map) {
                        java.util.Map<String, Object> requestMap = (java.util.Map<String, Object>) arg;
                        newStatus = (String) requestMap.get("status");
                        if (newStatus != null) {
                            break;
                        }
                    }
                }
                
                // If we found a status change in the request, use it
                if (newStatus != null && !newStatus.equals(beforeStatus)) {
                    beforeChanges.put("orderStatus", beforeStatus);
                    afterChanges.put("orderStatus", newStatus);
                    System.out.println("=== ORDER STATUS CHANGE DETECTED ===");
                    System.out.println("Before status: " + beforeStatus);
                    System.out.println("After status: " + newStatus);
                    System.out.println("=== END ORDER STATUS CHANGE ===");
                }
                
                // Also check changes from the extracted entity as fallback
                if (updatedOrder != null && !beforeChanges.containsKey("orderStatus")) {
                    // Get latest status from updated order
                    String afterStatus = null;
                    if (updatedOrder.getOrderStatusHistory() != null && !updatedOrder.getOrderStatusHistory().isEmpty()) {
                        // Sort by status date to get the latest status
                        java.util.List<com.Ojt.Ecommerce.entity.OrderStatus> sortedUpdatedHistory = new java.util.ArrayList<>(updatedOrder.getOrderStatusHistory());
                        sortedUpdatedHistory.sort((s1, s2) -> s2.getStatusDate().compareTo(s1.getStatusDate()));
                        com.Ojt.Ecommerce.entity.Status statusObj = sortedUpdatedHistory.get(0).getStatus();
                        afterStatus = statusObj != null ? statusObj.getName().name() : null;
                    }
                    
                        if (afterStatus != null && !afterStatus.equals(beforeStatus)) {
                        beforeChanges.put("orderStatus", beforeStatus);
                        afterChanges.put("orderStatus", afterStatus);
                        System.out.println("=== ORDER STATUS CHANGE DETECTED (from entity) ===");
                        System.out.println("Before status: " + beforeStatus);
                        System.out.println("After status: " + afterStatus);
                        System.out.println("=== END ORDER STATUS CHANGE ===");
                    }
                }
                
                // Check for other order changes (delivery fee, etc.)
                if (updatedOrder != null) {
                    // Compare delivery fee
                    if (beforeOrder.getDeliveryFee() != null && updatedOrder.getDeliveryFee() != null && 
                        !beforeOrder.getDeliveryFee().equals(updatedOrder.getDeliveryFee())) {
                        beforeChanges.put("deliveryFee", beforeOrder.getDeliveryFee());
                        afterChanges.put("deliveryFee", updatedOrder.getDeliveryFee());
                    }
                    
                    // Compare updated date
                    if (beforeOrder.getUpdatedDate() != null && updatedOrder.getUpdatedDate() != null && 
                        !beforeOrder.getUpdatedDate().equals(updatedOrder.getUpdatedDate())) {
                        beforeChanges.put("updatedDate", beforeOrder.getUpdatedDate());
                        afterChanges.put("updatedDate", updatedOrder.getUpdatedDate());
                    }
                }
            }
            // DISCOUNT
            if (logActivity.entityType().equals("DISCOUNT") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.Discount) {
                com.Ojt.Ecommerce.entity.Discount beforeDiscount = (com.Ojt.Ecommerce.entity.Discount) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual Discount entity from ResponseEntity
                com.Ojt.Ecommerce.entity.Discount updatedDiscount = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof com.Ojt.Ecommerce.entity.Discount) {
                        updatedDiscount = (com.Ojt.Ecommerce.entity.Discount) responseBody;
                        System.out.println("=== DISCOUNT ENTITY EXTRACTED ===");
                        System.out.println("Updated discount name: '" + updatedDiscount.getName() + "'");
                        System.out.println("Updated discount description: '" + updatedDiscount.getDescription() + "'");
                        System.out.println("Updated discount type: " + updatedDiscount.getDiscountType());
                        System.out.println("=== END DISCOUNT ENTITY EXTRACTED ===");
                    }
                }
                
                for (Object arg : args) {
                    if (arg instanceof com.Ojt.Ecommerce.dto.DiscountRequestDTO) {
                        com.Ojt.Ecommerce.dto.DiscountRequestDTO dto = (com.Ojt.Ecommerce.dto.DiscountRequestDTO) arg;
                        if (dto.getName() != null && !dto.getName().equals(beforeDiscount.getName())) {
                            beforeChanges.put("name", beforeDiscount.getName());
                            afterChanges.put("name", dto.getName());
                        }
                        if (dto.getCode() != null && !dto.getCode().equals(beforeDiscount.getCode())) {
                            beforeChanges.put("code", beforeDiscount.getCode());
                            afterChanges.put("code", dto.getCode());
                        }
                        if (dto.getDescription() != null && !dto.getDescription().equals(beforeDiscount.getDescription())) {
                            beforeChanges.put("description", beforeDiscount.getDescription());
                            afterChanges.put("description", dto.getDescription());
                        }
                        if (dto.getDiscountType() != null && !dto.getDiscountType().equals(beforeDiscount.getDiscountType() != null ? beforeDiscount.getDiscountType().name() : null)) {
                            beforeChanges.put("discountType", beforeDiscount.getDiscountType() != null ? beforeDiscount.getDiscountType().name() : null);
                            afterChanges.put("discountType", dto.getDiscountType());
                        }
                        if (dto.getDiscountValue() != null && !dto.getDiscountValue().equals(beforeDiscount.getDiscountValue())) {
                            beforeChanges.put("discountValue", beforeDiscount.getDiscountValue());
                            afterChanges.put("discountValue", dto.getDiscountValue());
                        }
                        if (dto.getStartDate() != null && !dto.getStartDate().toLocalDate().equals(beforeDiscount.getStartDate())) {
                            beforeChanges.put("startDate", beforeDiscount.getStartDate());
                            afterChanges.put("startDate", dto.getStartDate().toLocalDate());
                        }
                        if (dto.getEndDate() != null && !dto.getEndDate().toLocalDate().equals(beforeDiscount.getEndDate())) {
                            beforeChanges.put("endDate", beforeDiscount.getEndDate());
                            afterChanges.put("endDate", dto.getEndDate().toLocalDate());
                        }
                        if (dto.getAutoApply() != null && !dto.getAutoApply().equals(beforeDiscount.getAutoApply())) {
                            beforeChanges.put("autoApply", beforeDiscount.getAutoApply());
                            afterChanges.put("autoApply", dto.getAutoApply());
                        }
                        if (dto.isStatus() != beforeDiscount.isStatus()) {
                            beforeChanges.put("status", beforeDiscount.isStatus());
                            afterChanges.put("status", dto.isStatus());
                        }
                    }
                }
                
                // Also check changes from the extracted entity as fallback
                if (updatedDiscount != null) {
                    if (updatedDiscount.getName() != null && !updatedDiscount.getName().equals(beforeDiscount.getName())) {
                        if (!beforeChanges.containsKey("name")) {
                            beforeChanges.put("name", beforeDiscount.getName());
                            afterChanges.put("name", updatedDiscount.getName());
                        }
                    }
                    if (updatedDiscount.getDescription() != null && !updatedDiscount.getDescription().equals(beforeDiscount.getDescription())) {
                        if (!beforeChanges.containsKey("description")) {
                            beforeChanges.put("description", beforeDiscount.getDescription());
                            afterChanges.put("description", updatedDiscount.getDescription());
                        }
                    }
                    if (updatedDiscount.getDiscountType() != null && !updatedDiscount.getDiscountType().equals(beforeDiscount.getDiscountType())) {
                        if (!beforeChanges.containsKey("discountType")) {
                            beforeChanges.put("discountType", beforeDiscount.getDiscountType() != null ? beforeDiscount.getDiscountType().name() : null);
                            afterChanges.put("discountType", updatedDiscount.getDiscountType().name());
                        }
                    }
                    if (updatedDiscount.getDiscountValue() != null && !updatedDiscount.getDiscountValue().equals(beforeDiscount.getDiscountValue())) {
                        if (!beforeChanges.containsKey("discountValue")) {
                            beforeChanges.put("discountValue", beforeDiscount.getDiscountValue());
                            afterChanges.put("discountValue", updatedDiscount.getDiscountValue());
                        }
                    }
                    if (updatedDiscount.getStartDate() != null && !updatedDiscount.getStartDate().equals(beforeDiscount.getStartDate())) {
                        if (!beforeChanges.containsKey("startDate")) {
                            beforeChanges.put("startDate", beforeDiscount.getStartDate());
                            afterChanges.put("startDate", updatedDiscount.getStartDate());
                        }
                    }
                    if (updatedDiscount.getEndDate() != null && !updatedDiscount.getEndDate().equals(beforeDiscount.getEndDate())) {
                        if (!beforeChanges.containsKey("endDate")) {
                            beforeChanges.put("endDate", beforeDiscount.getEndDate());
                            afterChanges.put("endDate", updatedDiscount.getEndDate());
                        }
                    }
                    if (updatedDiscount.isStatus() != beforeDiscount.isStatus()) {
                        if (!beforeChanges.containsKey("status")) {
                            beforeChanges.put("status", beforeDiscount.isStatus());
                            afterChanges.put("status", updatedDiscount.isStatus());
                        }
                    }
                }
            }
            
            // RETURN_REQUEST
            if (logActivity.entityType().equals("RETURN_REQUEST") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.ReturnRequest) {
                com.Ojt.Ecommerce.entity.ReturnRequest beforeReturnRequest = (com.Ojt.Ecommerce.entity.ReturnRequest) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual ReturnRequest entity from ResponseEntity
                com.Ojt.Ecommerce.entity.ReturnRequest updatedReturnRequest = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof com.Ojt.Ecommerce.entity.ReturnRequest) {
                        updatedReturnRequest = (com.Ojt.Ecommerce.entity.ReturnRequest) responseBody;
                    }
                }
                
                // Check for status changes from request parameters
                for (Object arg : args) {
                    if (arg instanceof com.Ojt.Ecommerce.dto.ApproveRejectRequest) {
                        com.Ojt.Ecommerce.dto.ApproveRejectRequest request = (com.Ojt.Ecommerce.dto.ApproveRejectRequest) arg;
                        String newStatus = null;
                        
                        // Determine new status based on the method being called
                        String methodName = joinPoint.getSignature().getName();
                        if (methodName.contains("approve")) {
                            newStatus = "APPROVED";
                        } else if (methodName.contains("reject")) {
                            newStatus = "REJECTED";
                        } else if (methodName.contains("replacement")) {
                            newStatus = "REPLACEMENT_PROCESSED";
                        } else if (methodName.contains("refund")) {
                            newStatus = "REFUND_PROCESSED";
                        } else if (methodName.contains("cancel")) {
                            newStatus = "CANCELLED";
                        }
                        
                        if (newStatus != null && !newStatus.equals(beforeReturnRequest.getStatus().name())) {
                            beforeChanges.put("status", beforeReturnRequest.getStatus().name());
                            afterChanges.put("status", newStatus);
                        }
                        
                        // Check admin remark changes
                        if (request.getAdminRemark() != null && !request.getAdminRemark().equals(beforeReturnRequest.getAdminRemark())) {
                            beforeChanges.put("adminRemark", beforeReturnRequest.getAdminRemark());
                            afterChanges.put("adminRemark", request.getAdminRemark());
                        }
                    }
                }
                
                // Also check changes from the extracted entity as fallback
                if (updatedReturnRequest != null) {
                    if (updatedReturnRequest.getStatus() != null && !updatedReturnRequest.getStatus().equals(beforeReturnRequest.getStatus())) {
                        if (!beforeChanges.containsKey("status")) {
                            beforeChanges.put("status", beforeReturnRequest.getStatus().name());
                            afterChanges.put("status", updatedReturnRequest.getStatus().name());
                        }
                    }
                    if (updatedReturnRequest.getAdminRemark() != null && !updatedReturnRequest.getAdminRemark().equals(beforeReturnRequest.getAdminRemark())) {
                        if (!beforeChanges.containsKey("adminRemark")) {
                            beforeChanges.put("adminRemark", beforeReturnRequest.getAdminRemark());
                            afterChanges.put("adminRemark", updatedReturnRequest.getAdminRemark());
                        }
                    }
                }
            }
            
            // REVIEW
            if (logActivity.entityType().equals("REVIEW") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.Review) {
                com.Ojt.Ecommerce.entity.Review beforeReview = (com.Ojt.Ecommerce.entity.Review) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract parameters from method arguments
                Integer newRating = null;
                String newComment = null;
                
                // Review updates use individual parameters
                if (args.length >= 4) {
                    // Arg[0] = id (Long) - review ID
                    // Arg[1] = rating (int) - new rating
                    // Arg[2] = comment (String) - new comment
                    // Arg[3] = mediaFiles (MultipartFile[]) - media files
                    
                    if (args[1] instanceof Integer) {
                        newRating = (Integer) args[1];
                    } else if (args[1] instanceof String) {
                        try {
                            newRating = Integer.parseInt((String) args[1]);
                        } catch (NumberFormatException ignored) {}
                    }
                    
                    if (args[2] instanceof String) {
                        newComment = (String) args[2];
                    }
                }
                
                // Check rating changes
                if (newRating != null && newRating != beforeReview.getRating()) {
                    beforeChanges.put("rating", beforeReview.getRating());
                    afterChanges.put("rating", newRating);
                }
                
                // Check comment changes
                if (newComment != null && !newComment.equals(beforeReview.getComment())) {
                    beforeChanges.put("comment", beforeReview.getComment());
                    afterChanges.put("comment", newComment);
                }
            }
            
            // EVENT
            if (logActivity.entityType().equals("EVENT") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.Events) {
                com.Ojt.Ecommerce.entity.Events beforeEvent = (com.Ojt.Ecommerce.entity.Events) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual Event entity from ResponseEntity
                com.Ojt.Ecommerce.entity.Events updatedEvent = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof com.Ojt.Ecommerce.entity.Events) {
                        updatedEvent = (com.Ojt.Ecommerce.entity.Events) responseBody;
                    }
                }
                
                // Check for EventDTO in arguments
                for (Object arg : args) {
                    if (arg instanceof com.Ojt.Ecommerce.dto.EventDTO) {
                        com.Ojt.Ecommerce.dto.EventDTO dto = (com.Ojt.Ecommerce.dto.EventDTO) arg;
                        
                        if (dto.getName() != null && !dto.getName().equals(beforeEvent.getName())) {
                            beforeChanges.put("name", beforeEvent.getName());
                            afterChanges.put("name", dto.getName());
                        }
                        if (dto.getDescription() != null && !dto.getDescription().equals(beforeEvent.getDescription())) {
                            beforeChanges.put("description", beforeEvent.getDescription());
                            afterChanges.put("description", dto.getDescription());
                        }
                        if (dto.getSlideNo() != null && !dto.getSlideNo().equals(beforeEvent.getSlideNo())) {
                            beforeChanges.put("slideNo", beforeEvent.getSlideNo());
                            afterChanges.put("slideNo", dto.getSlideNo());
                        }
                        if (dto.getStartDate() != null && !dto.getStartDate().equals(beforeEvent.getStartDate())) {
                            beforeChanges.put("startDate", beforeEvent.getStartDate());
                            afterChanges.put("startDate", dto.getStartDate());
                        }
                        if (dto.getEndDate() != null && !dto.getEndDate().equals(beforeEvent.getEndDate())) {
                            beforeChanges.put("endDate", beforeEvent.getEndDate());
                            afterChanges.put("endDate", dto.getEndDate());
                        }
                        if (dto.getStatus() != null && !dto.getStatus().equals(beforeEvent.getStatus())) {
                            beforeChanges.put("status", beforeEvent.getStatus());
                            afterChanges.put("status", dto.getStatus());
                        }
                    }
                }
                
                // Also check changes from the extracted entity as fallback
                if (updatedEvent != null) {
                    if (updatedEvent.getName() != null && !updatedEvent.getName().equals(beforeEvent.getName())) {
                        if (!beforeChanges.containsKey("name")) {
                            beforeChanges.put("name", beforeEvent.getName());
                            afterChanges.put("name", updatedEvent.getName());
                        }
                    }
                    if (updatedEvent.getDescription() != null && !updatedEvent.getDescription().equals(beforeEvent.getDescription())) {
                        if (!beforeChanges.containsKey("description")) {
                            beforeChanges.put("description", beforeEvent.getDescription());
                            afterChanges.put("description", updatedEvent.getDescription());
                        }
                    }
                    if (updatedEvent.getEventImage() != null && !updatedEvent.getEventImage().equals(beforeEvent.getEventImage())) {
                        if (!beforeChanges.containsKey("eventImage")) {
                            beforeChanges.put("eventImage", beforeEvent.getEventImage());
                            afterChanges.put("eventImage", updatedEvent.getEventImage());
                        }
                    }
                }
            }
            
            // BLACKLIST
            if (logActivity.entityType().equals("BLACKLIST") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.BlacklistEntry) {
                com.Ojt.Ecommerce.entity.BlacklistEntry beforeBlacklistEntry = (com.Ojt.Ecommerce.entity.BlacklistEntry) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual BlacklistEntry entity from ResponseEntity
                com.Ojt.Ecommerce.entity.BlacklistEntry updatedBlacklistEntry = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof com.Ojt.Ecommerce.entity.BlacklistEntry) {
                        updatedBlacklistEntry = (com.Ojt.Ecommerce.entity.BlacklistEntry) responseBody;
                    }
                }
                
                // Check for BlacklistEntry in arguments
                for (Object arg : args) {
                    if (arg instanceof com.Ojt.Ecommerce.entity.BlacklistEntry) {
                        com.Ojt.Ecommerce.entity.BlacklistEntry dto = (com.Ojt.Ecommerce.entity.BlacklistEntry) arg;
                        
                        if (dto.getTargetType() != null && !dto.getTargetType().equals(beforeBlacklistEntry.getTargetType())) {
                            beforeChanges.put("targetType", beforeBlacklistEntry.getTargetType().name());
                            afterChanges.put("targetType", dto.getTargetType().name());
                        }
                        if (dto.getTargetValue() != null && !dto.getTargetValue().equals(beforeBlacklistEntry.getTargetValue())) {
                            beforeChanges.put("targetValue", beforeBlacklistEntry.getTargetValue());
                            afterChanges.put("targetValue", dto.getTargetValue());
                        }
                        if (dto.getCategory() != null && !dto.getCategory().equals(beforeBlacklistEntry.getCategory())) {
                            beforeChanges.put("category", beforeBlacklistEntry.getCategory().name());
                            afterChanges.put("category", dto.getCategory().name());
                        }
                        if (dto.getReason() != null && !dto.getReason().equals(beforeBlacklistEntry.getReason())) {
                            beforeChanges.put("reason", beforeBlacklistEntry.getReason());
                            afterChanges.put("reason", dto.getReason());
                        }
                        if (dto.getRiskLevel() != null && !dto.getRiskLevel().equals(beforeBlacklistEntry.getRiskLevel())) {
                            beforeChanges.put("riskLevel", beforeBlacklistEntry.getRiskLevel().name());
                            afterChanges.put("riskLevel", dto.getRiskLevel().name());
                        }
                        if (dto.getStatus() != null && !dto.getStatus().equals(beforeBlacklistEntry.getStatus())) {
                            beforeChanges.put("status", beforeBlacklistEntry.getStatus().name());
                            afterChanges.put("status", dto.getStatus().name());
                        }
                        if (dto.getNotes() != null && !dto.getNotes().equals(beforeBlacklistEntry.getNotes())) {
                            beforeChanges.put("notes", beforeBlacklistEntry.getNotes());
                            afterChanges.put("notes", dto.getNotes());
                        }
                    }
                }
                
                // Also check changes from the extracted entity as fallback
                if (updatedBlacklistEntry != null) {
                    if (updatedBlacklistEntry.getTargetType() != null && !updatedBlacklistEntry.getTargetType().equals(beforeBlacklistEntry.getTargetType())) {
                        if (!beforeChanges.containsKey("targetType")) {
                            beforeChanges.put("targetType", beforeBlacklistEntry.getTargetType().name());
                            afterChanges.put("targetType", updatedBlacklistEntry.getTargetType().name());
                        }
                    }
                    if (updatedBlacklistEntry.getStatus() != null && !updatedBlacklistEntry.getStatus().equals(beforeBlacklistEntry.getStatus())) {
                        if (!beforeChanges.containsKey("status")) {
                            beforeChanges.put("status", beforeBlacklistEntry.getStatus().name());
                            afterChanges.put("status", updatedBlacklistEntry.getStatus().name());
                        }
                    }
                }
            }
            
            // VIP_TIER
            if (logActivity.entityType().equals("VIP_TIER") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.VipTier) {
                com.Ojt.Ecommerce.entity.VipTier beforeVipTier = (com.Ojt.Ecommerce.entity.VipTier) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual VipTier entity from ResponseEntity
                com.Ojt.Ecommerce.entity.VipTier updatedVipTier = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof com.Ojt.Ecommerce.entity.VipTier) {
                        updatedVipTier = (com.Ojt.Ecommerce.entity.VipTier) responseBody;
                    }
                }
                
                // Check for VipTier in arguments
                for (Object arg : args) {
                    if (arg instanceof com.Ojt.Ecommerce.entity.VipTier) {
                        com.Ojt.Ecommerce.entity.VipTier dto = (com.Ojt.Ecommerce.entity.VipTier) arg;
                        
                        if (dto.getName() != null && !dto.getName().equals(beforeVipTier.getName())) {
                            beforeChanges.put("name", beforeVipTier.getName());
                            afterChanges.put("name", dto.getName());
                        }
                        if (dto.getDescription() != null && !dto.getDescription().equals(beforeVipTier.getDescription())) {
                            beforeChanges.put("description", beforeVipTier.getDescription());
                            afterChanges.put("description", dto.getDescription());
                        }
                        if (dto.getMinPoints() != null && !dto.getMinPoints().equals(beforeVipTier.getMinPoints())) {
                            beforeChanges.put("minPoints", beforeVipTier.getMinPoints());
                            afterChanges.put("minPoints", dto.getMinPoints());
                        }
                        if (dto.getWeight() != null && !dto.getWeight().equals(beforeVipTier.getWeight())) {
                            beforeChanges.put("weight", beforeVipTier.getWeight());
                            afterChanges.put("weight", dto.getWeight());
                        }
                        if (dto.getColor() != null && !dto.getColor().equals(beforeVipTier.getColor())) {
                            beforeChanges.put("color", beforeVipTier.getColor());
                            afterChanges.put("color", dto.getColor());
                        }
                        if (dto.getIcon() != null && !dto.getIcon().equals(beforeVipTier.getIcon())) {
                            beforeChanges.put("icon", beforeVipTier.getIcon());
                            afterChanges.put("icon", dto.getIcon());
                        }
                        if (dto.getOrder() != null && !dto.getOrder().equals(beforeVipTier.getOrder())) {
                            beforeChanges.put("order", beforeVipTier.getOrder());
                            afterChanges.put("order", dto.getOrder());
                        }
                    }
                }
                
                // Also check changes from the extracted entity as fallback
                if (updatedVipTier != null) {
                    if (updatedVipTier.getName() != null && !updatedVipTier.getName().equals(beforeVipTier.getName())) {
                        if (!beforeChanges.containsKey("name")) {
                            beforeChanges.put("name", beforeVipTier.getName());
                            afterChanges.put("name", updatedVipTier.getName());
                        }
                    }
                    if (updatedVipTier.getDescription() != null && !updatedVipTier.getDescription().equals(beforeVipTier.getDescription())) {
                        if (!beforeChanges.containsKey("description")) {
                            beforeChanges.put("description", beforeVipTier.getDescription());
                            afterChanges.put("description", updatedVipTier.getDescription());
                        }
                    }
                    if (updatedVipTier.getMinPoints() != null && !updatedVipTier.getMinPoints().equals(beforeVipTier.getMinPoints())) {
                        if (!beforeChanges.containsKey("minPoints")) {
                            beforeChanges.put("minPoints", beforeVipTier.getMinPoints());
                            afterChanges.put("minPoints", updatedVipTier.getMinPoints());
                        }
                    }
                }
            }
            
            // Only add to changes if there are actual changes
            System.out.println("=== FINAL CHECK ===");
            System.out.println("afterChanges size: " + afterChanges.size());
            System.out.println("afterChanges content: " + afterChanges);
            System.out.println("beforeChanges size: " + beforeChanges.size());
            System.out.println("beforeChanges content: " + beforeChanges);
            
            if (!afterChanges.isEmpty()) {
                changes.put("before", beforeChanges);
                changes.put("after", afterChanges);
                changes.put("changedFields", afterChanges.keySet());
                System.out.println("=== FINAL CHANGES DEBUG ===");
                System.out.println("Changes being saved: " + changes);
                System.out.println("=== END FINAL CHANGES DEBUG ===");
            } else {
                System.out.println("=== NO CHANGES DEBUG ===");
                System.out.println("No changes detected - afterChanges is empty");
                System.out.println("=== END NO CHANGES DEBUG ===");
            }
            System.out.println("=== END FINAL CHECK ===");
            
            // ROLE
            if (logActivity.entityType().equals("ROLE") && logActivity.actionType().equals("UPDATE") && originalState instanceof Role) {
                Role beforeRole = (Role) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual Role entity from ResponseEntity
                Role updatedRole = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof Role) {
                        updatedRole = (Role) responseBody;
                    }
                }
                
                if (updatedRole != null) {
                    if (updatedRole.getName() != null && !updatedRole.getName().equals(beforeRole.getName())) {
                        beforeChanges.put("name", beforeRole.getName());
                        afterChanges.put("name", updatedRole.getName());
                    }
                    if (updatedRole.getLevel() != beforeRole.getLevel()) {
                        beforeChanges.put("level", beforeRole.getLevel());
                        afterChanges.put("level", updatedRole.getLevel());
                    }
                }
            }
            
            // PERMISSION
            if (logActivity.entityType().equals("PERMISSION") && logActivity.actionType().equals("UPDATE") && originalState instanceof Permission) {
                Permission beforePermission = (Permission) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual Permission entity from ResponseEntity
                Permission updatedPermission = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof Permission) {
                        updatedPermission = (Permission) responseBody;
                    }
                }
                
                if (updatedPermission != null) {
                    if (updatedPermission.getName() != null && !updatedPermission.getName().equals(beforePermission.getName())) {
                        beforeChanges.put("name", beforePermission.getName());
                        afterChanges.put("name", updatedPermission.getName());
                    }
                    if (updatedPermission.getDescription() != null && !updatedPermission.getDescription().equals(beforePermission.getDescription())) {
                        beforeChanges.put("description", beforePermission.getDescription());
                        afterChanges.put("description", updatedPermission.getDescription());
                    }
                    if (updatedPermission.getLevel() != null && !updatedPermission.getLevel().equals(beforePermission.getLevel())) {
                        beforeChanges.put("level", beforePermission.getLevel());
                        afterChanges.put("level", updatedPermission.getLevel());
                    }
                }
            }
            
            // ADMIN_USER
            if (logActivity.entityType().equals("ADMIN_USER") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.User) {
                com.Ojt.Ecommerce.entity.User beforeAdminUser = (com.Ojt.Ecommerce.entity.User) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual User entity from ResponseEntity
                com.Ojt.Ecommerce.entity.User updatedAdminUser = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof com.Ojt.Ecommerce.entity.User) {
                        updatedAdminUser = (com.Ojt.Ecommerce.entity.User) responseBody;
                    }
                }
                
                if (updatedAdminUser != null) {
                    if (updatedAdminUser.getName() != null && !updatedAdminUser.getName().equals(beforeAdminUser.getName())) {
                        beforeChanges.put("name", beforeAdminUser.getName());
                        afterChanges.put("name", updatedAdminUser.getName());
                    }
                    if (updatedAdminUser.getEmail() != null && !updatedAdminUser.getEmail().equals(beforeAdminUser.getEmail())) {
                        beforeChanges.put("email", beforeAdminUser.getEmail());
                        afterChanges.put("email", updatedAdminUser.getEmail());
                    }
                    if (updatedAdminUser.getPhoneNumber() != null && !updatedAdminUser.getPhoneNumber().equals(beforeAdminUser.getPhoneNumber())) {
                        beforeChanges.put("phoneNumber", beforeAdminUser.getPhoneNumber());
                        afterChanges.put("phoneNumber", updatedAdminUser.getPhoneNumber());
                    }
                    if (updatedAdminUser.getStatus() != null && !updatedAdminUser.getStatus().equals(beforeAdminUser.getStatus())) {
                        beforeChanges.put("status", beforeAdminUser.getStatus());
                        afterChanges.put("status", updatedAdminUser.getStatus());
                    }
                }
            }
            
            // ATTRIBUTE
            if (logActivity.entityType().equals("ATTRIBUTE") && logActivity.actionType().equals("UPDATE") && originalState instanceof Attribute) {
                Attribute beforeAttribute = (Attribute) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual Attribute entity from ResponseEntity
                Attribute updatedAttribute = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof Attribute) {
                        updatedAttribute = (Attribute) responseBody;
                    }
                }
                
                if (updatedAttribute != null) {
                    if (updatedAttribute.getName() != null && !updatedAttribute.getName().equals(beforeAttribute.getName())) {
                        beforeChanges.put("name", beforeAttribute.getName());
                        afterChanges.put("name", updatedAttribute.getName());
                    }
                    if (updatedAttribute.getStatus() != null && !updatedAttribute.getStatus().equals(beforeAttribute.getStatus())) {
                        beforeChanges.put("status", beforeAttribute.getStatus());
                        afterChanges.put("status", updatedAttribute.getStatus());
                    }
                    if (updatedAttribute.getStatus() != null && !updatedAttribute.getStatus().equals(beforeAttribute.getStatus())) {
                        beforeChanges.put("status", beforeAttribute.getStatus());
                        afterChanges.put("status", updatedAttribute.getStatus());
                    }
                }
            }
            
            // DELIVERY_SERVICE
            if (logActivity.entityType().equals("DELIVERY_SERVICE") && logActivity.actionType().equals("UPDATE") && originalState instanceof DeliveryService) {
                DeliveryService beforeDeliveryService = (DeliveryService) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual DeliveryService entity from ResponseEntity
                DeliveryService updatedDeliveryService = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof DeliveryService) {
                        updatedDeliveryService = (DeliveryService) responseBody;
                    }
                }
                
                if (updatedDeliveryService != null) {
                    if (updatedDeliveryService.getName() != null && !updatedDeliveryService.getName().equals(beforeDeliveryService.getName())) {
                        beforeChanges.put("name", beforeDeliveryService.getName());
                        afterChanges.put("name", updatedDeliveryService.getName());
                    }
                    if (updatedDeliveryService.getFeePerKm() != null && !updatedDeliveryService.getFeePerKm().equals(beforeDeliveryService.getFeePerKm())) {
                        beforeChanges.put("feePerKm", beforeDeliveryService.getFeePerKm());
                        afterChanges.put("feePerKm", updatedDeliveryService.getFeePerKm());
                    }
                    if (updatedDeliveryService.getPhoneNumber() != null && !updatedDeliveryService.getPhoneNumber().equals(beforeDeliveryService.getPhoneNumber())) {
                        beforeChanges.put("phoneNumber", beforeDeliveryService.getPhoneNumber());
                        afterChanges.put("phoneNumber", updatedDeliveryService.getPhoneNumber());
                    }
                    if (updatedDeliveryService.getStatus() != null && !updatedDeliveryService.getStatus().equals(beforeDeliveryService.getStatus())) {
                        beforeChanges.put("status", beforeDeliveryService.getStatus());
                        afterChanges.put("status", updatedDeliveryService.getStatus());
                    }
                }
            }
            
            // POLICY
            if (logActivity.entityType().equals("POLICY") && logActivity.actionType().equals("UPDATE") && originalState instanceof Policy) {
                Policy beforePolicy = (Policy) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual Policy entity from ResponseEntity
                Policy updatedPolicy = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof Policy) {
                        updatedPolicy = (Policy) responseBody;
                    }
                }
                
                if (updatedPolicy != null) {
                    if (updatedPolicy.getTitle() != null && !updatedPolicy.getTitle().equals(beforePolicy.getTitle())) {
                        beforeChanges.put("title", beforePolicy.getTitle());
                        afterChanges.put("title", updatedPolicy.getTitle());
                    }
                    if (updatedPolicy.getContent() != null && !updatedPolicy.getContent().equals(beforePolicy.getContent())) {
                        beforeChanges.put("content", beforePolicy.getContent());
                        afterChanges.put("content", updatedPolicy.getContent());
                    }

                    if (updatedPolicy.getStatus() != null && !updatedPolicy.getStatus().equals(beforePolicy.getStatus())) {
                        beforeChanges.put("status", beforePolicy.getStatus());
                        afterChanges.put("status", updatedPolicy.getStatus());
                    }
                }
            }
            
            // APPEAL
            if (logActivity.entityType().equals("APPEAL") && logActivity.actionType().equals("UPDATE") && originalState instanceof Appeal) {
                Appeal beforeAppeal = (Appeal) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual Appeal entity from ResponseEntity
                Appeal updatedAppeal = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof Appeal) {
                        updatedAppeal = (Appeal) responseBody;
                    }
                }
                
                if (updatedAppeal != null) {
                    if (updatedAppeal.getUserEmail() != null && !updatedAppeal.getUserEmail().equals(beforeAppeal.getUserEmail())) {
                        beforeChanges.put("userEmail", beforeAppeal.getUserEmail());
                        afterChanges.put("userEmail", updatedAppeal.getUserEmail());
                    }
                    if (updatedAppeal.getAppealReason() != null && !updatedAppeal.getAppealReason().equals(beforeAppeal.getAppealReason())) {
                        beforeChanges.put("appealReason", beforeAppeal.getAppealReason());
                        afterChanges.put("appealReason", updatedAppeal.getAppealReason());
                    }
                    if (updatedAppeal.getAppealDetails() != null && !updatedAppeal.getAppealDetails().equals(beforeAppeal.getAppealDetails())) {
                        beforeChanges.put("appealDetails", beforeAppeal.getAppealDetails());
                        afterChanges.put("appealDetails", updatedAppeal.getAppealDetails());
                    }
                    if (updatedAppeal.getStatus() != null && !updatedAppeal.getStatus().equals(beforeAppeal.getStatus())) {
                        beforeChanges.put("status", beforeAppeal.getStatus());
                        afterChanges.put("status", updatedAppeal.getStatus());
                    }
                    if (updatedAppeal.getAdminNotes() != null && !updatedAppeal.getAdminNotes().equals(beforeAppeal.getAdminNotes())) {
                        beforeChanges.put("adminNotes", beforeAppeal.getAdminNotes());
                        afterChanges.put("adminNotes", updatedAppeal.getAdminNotes());
                    }
                }
            }
            
            // REVENUE_TARGET
            if (logActivity.entityType().equals("REVENUE_TARGET") && logActivity.actionType().equals("UPDATE") && originalState instanceof RevenueTarget) {
                RevenueTarget beforeRevenueTarget = (RevenueTarget) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual RevenueTarget entity from ResponseEntity
                RevenueTarget updatedRevenueTarget = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof RevenueTarget) {
                        updatedRevenueTarget = (RevenueTarget) responseBody;
                    }
                }
                
                if (updatedRevenueTarget != null) {
                    if (updatedRevenueTarget.getTargetAmount() != null && !updatedRevenueTarget.getTargetAmount().equals(beforeRevenueTarget.getTargetAmount())) {
                        beforeChanges.put("targetAmount", beforeRevenueTarget.getTargetAmount());
                        afterChanges.put("targetAmount", updatedRevenueTarget.getTargetAmount());
                    }
                    if (updatedRevenueTarget.getPeriodType() != null && !updatedRevenueTarget.getPeriodType().equals(beforeRevenueTarget.getPeriodType())) {
                        beforeChanges.put("periodType", beforeRevenueTarget.getPeriodType());
                        afterChanges.put("periodType", updatedRevenueTarget.getPeriodType());
                    }
                    if (updatedRevenueTarget.getPeriodValue() != null && !updatedRevenueTarget.getPeriodValue().equals(beforeRevenueTarget.getPeriodValue())) {
                        beforeChanges.put("periodValue", beforeRevenueTarget.getPeriodValue());
                        afterChanges.put("periodValue", updatedRevenueTarget.getPeriodValue());
                    }
                }
            }
            
            // NOTIFICATION
            if (logActivity.entityType().equals("NOTIFICATION") && logActivity.actionType().equals("UPDATE") && originalState instanceof Notification) {
                Notification beforeNotification = (Notification) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual Notification entity from ResponseEntity
                Notification updatedNotification = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof Notification) {
                        updatedNotification = (Notification) responseBody;
                    }
                }
                
                if (updatedNotification != null) {
                    if (updatedNotification.getRecipientEmail() != null && !updatedNotification.getRecipientEmail().equals(beforeNotification.getRecipientEmail())) {
                        beforeChanges.put("recipientEmail", beforeNotification.getRecipientEmail());
                        afterChanges.put("recipientEmail", updatedNotification.getRecipientEmail());
                    }
                    if (updatedNotification.getMessage() != null && !updatedNotification.getMessage().equals(beforeNotification.getMessage())) {
                        beforeChanges.put("message", beforeNotification.getMessage());
                        afterChanges.put("message", updatedNotification.getMessage());
                    }
                    if (updatedNotification.getType() != null && !updatedNotification.getType().equals(beforeNotification.getType())) {
                        beforeChanges.put("type", beforeNotification.getType());
                        afterChanges.put("type", updatedNotification.getType());
                    }
                    if (updatedNotification.isRead() != beforeNotification.isRead()) {
                        beforeChanges.put("read", beforeNotification.isRead());
                        afterChanges.put("read", updatedNotification.isRead());
                    }
                }
            }
            
            // CONTACT
            if (logActivity.entityType().equals("CONTACT") && logActivity.actionType().equals("UPDATE") && originalState instanceof ContactMessage) {
                ContactMessage beforeContact = (ContactMessage) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual ContactMessage entity from ResponseEntity
                ContactMessage updatedContact = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof ContactMessage) {
                        updatedContact = (ContactMessage) responseBody;
                    }
                }
                
                if (updatedContact != null) {
                    if (updatedContact.getName() != null && !updatedContact.getName().equals(beforeContact.getName())) {
                        beforeChanges.put("name", beforeContact.getName());
                        afterChanges.put("name", updatedContact.getName());
                    }
                    if (updatedContact.getEmail() != null && !updatedContact.getEmail().equals(beforeContact.getEmail())) {
                        beforeChanges.put("email", beforeContact.getEmail());
                        afterChanges.put("email", updatedContact.getEmail());
                    }
                    if (updatedContact.getSubject() != null && !updatedContact.getSubject().equals(beforeContact.getSubject())) {
                        beforeChanges.put("subject", beforeContact.getSubject());
                        afterChanges.put("subject", updatedContact.getSubject());
                    }
                    if (updatedContact.getMessage() != null && !updatedContact.getMessage().equals(beforeContact.getMessage())) {
                        beforeChanges.put("message", beforeContact.getMessage());
                        afterChanges.put("message", updatedContact.getMessage());
                    }
                }
            }
            
            // NEWSLETTER
            if (logActivity.entityType().equals("NEWSLETTER") && logActivity.actionType().equals("UPDATE") && originalState instanceof NewsLetterSubscriber) {
                NewsLetterSubscriber beforeNewsLetter = (NewsLetterSubscriber) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual NewsLetterSubscriber entity from ResponseEntity
                NewsLetterSubscriber updatedNewsLetter = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof NewsLetterSubscriber) {
                        updatedNewsLetter = (NewsLetterSubscriber) responseBody;
                    }
                }
                
                if (updatedNewsLetter != null) {
                    if (updatedNewsLetter.getEmail() != null && !updatedNewsLetter.getEmail().equals(beforeNewsLetter.getEmail())) {
                        beforeChanges.put("email", beforeNewsLetter.getEmail());
                        afterChanges.put("email", updatedNewsLetter.getEmail());
                    }
                }
            }
            
            // SAVED_CARD
            if (logActivity.entityType().equals("SAVED_CARD") && logActivity.actionType().equals("UPDATE") && originalState instanceof SavedCard) {
                SavedCard beforeSavedCard = (SavedCard) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual SavedCard entity from ResponseEntity
                SavedCard updatedSavedCard = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof SavedCard) {
                        updatedSavedCard = (SavedCard) responseBody;
                    }
                }
                
                if (updatedSavedCard != null) {
                    if (updatedSavedCard.getCardholderName() != null && !updatedSavedCard.getCardholderName().equals(beforeSavedCard.getCardholderName())) {
                        beforeChanges.put("cardholderName", beforeSavedCard.getCardholderName());
                        afterChanges.put("cardholderName", updatedSavedCard.getCardholderName());
                    }
                    if (updatedSavedCard.getCardNumber() != null && !updatedSavedCard.getCardNumber().equals(beforeSavedCard.getCardNumber())) {
                        beforeChanges.put("cardNumber", beforeSavedCard.getCardNumber());
                        afterChanges.put("cardNumber", updatedSavedCard.getCardNumber());
                    }
                    if (updatedSavedCard.getExpiryDate() != null && !updatedSavedCard.getExpiryDate().equals(beforeSavedCard.getExpiryDate())) {
                        beforeChanges.put("expiryDate", beforeSavedCard.getExpiryDate());
                        afterChanges.put("expiryDate", updatedSavedCard.getExpiryDate());
                    }
                    if (updatedSavedCard.getCardBrand() != null && !updatedSavedCard.getCardBrand().equals(beforeSavedCard.getCardBrand())) {
                        beforeChanges.put("cardBrand", beforeSavedCard.getCardBrand());
                        afterChanges.put("cardBrand", updatedSavedCard.getCardBrand());
                    }
                    if (updatedSavedCard.isDefault() != beforeSavedCard.isDefault()) {
                        beforeChanges.put("isDefault", beforeSavedCard.isDefault());
                        afterChanges.put("isDefault", updatedSavedCard.isDefault());
                    }
                    if (updatedSavedCard.getStatus() != null && !updatedSavedCard.getStatus().equals(beforeSavedCard.getStatus())) {
                        beforeChanges.put("status", beforeSavedCard.getStatus());
                        afterChanges.put("status", updatedSavedCard.getStatus());
                    }
                }
            }
            

            
            // LOGIN_ATTEMPT
            if (logActivity.entityType().equals("LOGIN_ATTEMPT") && logActivity.actionType().equals("UPDATE") && originalState instanceof LoginAttempt) {
                LoginAttempt beforeLoginAttempt = (LoginAttempt) originalState;
                Object[] args = joinPoint.getArgs();
                
                // Extract the actual LoginAttempt entity from ResponseEntity
                LoginAttempt updatedLoginAttempt = null;
                if (newState instanceof org.springframework.http.ResponseEntity) {
                    org.springframework.http.ResponseEntity<?> responseEntity = (org.springframework.http.ResponseEntity<?>) newState;
                    Object responseBody = responseEntity.getBody();
                    if (responseBody instanceof LoginAttempt) {
                        updatedLoginAttempt = (LoginAttempt) responseBody;
                    }
                }
                
                if (updatedLoginAttempt != null) {
                    if (updatedLoginAttempt.getUsername() != null && !updatedLoginAttempt.getUsername().equals(beforeLoginAttempt.getUsername())) {
                        beforeChanges.put("username", beforeLoginAttempt.getUsername());
                        afterChanges.put("username", updatedLoginAttempt.getUsername());
                    }
                    if (updatedLoginAttempt.getIpAddress() != null && !updatedLoginAttempt.getIpAddress().equals(beforeLoginAttempt.getIpAddress())) {
                        beforeChanges.put("ipAddress", beforeLoginAttempt.getIpAddress());
                        afterChanges.put("ipAddress", updatedLoginAttempt.getIpAddress());
                    }
                    if (updatedLoginAttempt.getStatus() != null && !updatedLoginAttempt.getStatus().equals(beforeLoginAttempt.getStatus())) {
                        beforeChanges.put("status", beforeLoginAttempt.getStatus());
                        afterChanges.put("status", updatedLoginAttempt.getStatus());
                    }
                }
            }
            

        } catch (Exception e) {
            changes.put("error", "Error capturing changes: " + e.getMessage());
        }
        return changes;
    }

    private String buildDescription(LogActivity logActivity, String entityName, String entityId) {
        String description = logActivity.description();
        
        if (description.isEmpty()) {
            description = logActivity.actionType() + " " + logActivity.entityType();
            if (entityName != null) {
                // For all operations, format with bold entity name
                if (logActivity.actionType().equals("DELETE")) {
                    description += " **" + entityName + "**";
                } else if (logActivity.actionType().equals("CREATE")) {
                    description += " **" + entityName + "**";
                } else if (logActivity.actionType().equals("UPDATE")) {
                    description += " **" + entityName + "**";
                } else {
                description += " '" + entityName + "'";
            }
            }
            // Only add ID for non-DELETE operations
            if (entityId != null && !logActivity.actionType().equals("DELETE")) {
                description += " (ID: " + entityId + ")";
            }
        } else if (entityName != null) {
            // If description is not empty but we have entity name, add it with bold formatting
            if (logActivity.actionType().equals("DELETE")) {
                description = description.replace(logActivity.entityType(), logActivity.entityType() + " **" + entityName + "**");
            } else if (logActivity.actionType().equals("CREATE")) {
                description = description.replace(logActivity.entityType(), logActivity.entityType() + " **" + entityName + "**");
            } else if (logActivity.actionType().equals("UPDATE")) {
                // For UPDATE, the description is "Updated brand", "Updated user", etc.
                // We need to replace "brand", "user", etc. with "brand **entityName**"
                String entityTypeLower = logActivity.entityType().toLowerCase();
                description = description.replace(entityTypeLower, entityTypeLower + " **" + entityName + "**");
            }
        }
        
        return description;
    }
    
    private String getRequestBody(HttpServletRequest request) {
        try {
            BufferedReader reader = request.getReader();
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        } catch (IOException e) {
            return "Error reading request body: " + e.getMessage();
        }
    }
    
    private Map<String, Object> extractUserInfoFromToken(String token) {
        try {
            // Simple JWT token parsing (without signature verification for debugging)
            String[] parts = token.split("\\.");
            if (parts.length == 3) {
                // Decode the payload (second part)
                String payload = parts[1];
                // Add padding if needed
                while (payload.length() % 4 != 0) {
                    payload += "=";
                }
                // Replace URL-safe characters
                payload = payload.replace('-', '+').replace('_', '/');
                
                // Decode base64
                byte[] decodedBytes = java.util.Base64.getDecoder().decode(payload);
                String decodedPayload = new String(decodedBytes);
                
                // Parse JSON
                return objectMapper.readValue(decodedPayload, Map.class);
            }
        } catch (Exception e) {
            System.err.println("Error parsing JWT token: " + e.getMessage());
        }
        return null;
    }
} 