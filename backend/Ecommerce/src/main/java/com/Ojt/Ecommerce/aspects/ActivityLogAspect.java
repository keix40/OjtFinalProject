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

    private final ObjectMapper objectMapper = new ObjectMapper();

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
            } else {
                userName = "UNKNOWN";
                userRole = "UNKNOWN";
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
                
                // Debug logging
                System.out.println("Activity Log Debug - IP: " + ipAddress + ", Location: " + userLocation);
                System.out.println("Activity Log Debug - RemoteAddr: " + request.getRemoteAddr());
                System.out.println("Activity Log Debug - X-Forwarded-For: " + request.getHeader("X-Forwarded-For"));
                System.out.println("Activity Log Debug - X-Client-IP: " + request.getHeader("X-Client-IP"));
                System.out.println("Activity Log Debug - X-Debug-IP: " + request.getHeader("X-Debug-IP"));
            }
        } catch (Exception e) {
            System.err.println("Error getting request info: " + e.getMessage());
        }

        // Extract entity information from method parameters
        String entityId = extractEntityId(joinPoint, logActivity.entityIdParam());
        String entityName = extractEntityName(joinPoint, logActivity.entityNameParam());

        // Store original state for change tracking
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

    private Object captureOriginalState(ProceedingJoinPoint joinPoint, LogActivity logActivity, String entityId) {
        try {
            if (logActivity.entityType().equals("USER") && entityId != null) {
                Long id = Long.valueOf(entityId);
                return userRepository.findById(id).orElse(null);
            }
            if (logActivity.entityType().equals("PRODUCT") && entityId != null) {
                Long id = Long.valueOf(entityId);
                return productRepository.findById(id).orElse(null);
            }
            if (logActivity.entityType().equals("CATEGORY") && entityId != null) {
                Long id = Long.valueOf(entityId);
                return categoryRepository.findById(id).orElse(null);
            }
            if (logActivity.entityType().equals("BRAND") && entityId != null) {
                Long id = Long.valueOf(entityId);
                return brandRepository.findById(id).orElse(null);
            }
            if (logActivity.entityType().equals("ADDRESS") && entityId != null) {
                Long id = Long.valueOf(entityId);
                return addressRepository.findById(id).orElse(null);
            }
            if (logActivity.entityType().equals("ORDER") && entityId != null) {
                Long id = Long.valueOf(entityId);
                return orderRepository.findById(id).orElse(null);
            }
            if (logActivity.entityType().equals("DISCOUNT") && entityId != null) {
                Long id = Long.valueOf(entityId);
                return discountRepository.findById(id).orElse(null);
            }
        } catch (Exception e) {
            System.err.println("Error fetching original entity: " + e.getMessage());
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
                MethodSignature signature = (MethodSignature) joinPoint.getSignature();
                String[] parameterNames = signature.getParameterNames();
                Object[] args = joinPoint.getArgs();
                com.Ojt.Ecommerce.dto.RegisterRequest request = null;
                for (int i = 0; i < parameterNames.length; i++) {
                    if (args[i] != null && args[i] instanceof com.Ojt.Ecommerce.dto.RegisterRequest) {
                        request = (com.Ojt.Ecommerce.dto.RegisterRequest) args[i];
                        break;
                    }
                }
                boolean anyChange = false;
                if (request != null) {
                    if (request.getName() != null && !request.getName().equals(beforeUser.getName())) {
                        beforeChanges.put("name", beforeUser.getName());
                        afterChanges.put("name", request.getName());
                        anyChange = true;
                    }
                    if (request.getEmail() != null && !request.getEmail().equals(beforeUser.getEmail())) {
                        beforeChanges.put("email", beforeUser.getEmail());
                        afterChanges.put("email", request.getEmail());
                        anyChange = true;
                    }
                    if (request.getPhoneNumber() != null && !request.getPhoneNumber().equals(beforeUser.getPhoneNumber())) {
                        beforeChanges.put("phoneNumber", beforeUser.getPhoneNumber());
                        afterChanges.put("phoneNumber", request.getPhoneNumber());
                        anyChange = true;
                    }
                    if (request.getDateOfBirth() != null && !request.getDateOfBirth().equals(beforeUser.getDateOfBirth())) {
                        beforeChanges.put("dateOfBirth", beforeUser.getDateOfBirth());
                        afterChanges.put("dateOfBirth", request.getDateOfBirth());
                        anyChange = true;
                    }
                    if (request.getGender() != null && !request.getGender().equals(beforeUser.getGender())) {
                        beforeChanges.put("gender", beforeUser.getGender());
                        afterChanges.put("gender", request.getGender());
                        anyChange = true;
                    }
                }
                // Always log changes, even if no field changed
                if (!anyChange) {
                    beforeChanges.put("info", "No changes detected");
                    afterChanges.put("info", "No changes detected");
                }
            }
            // PRODUCT
            if (logActivity.entityType().equals("PRODUCT") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.Product) {
                com.Ojt.Ecommerce.entity.Product beforeProduct = (com.Ojt.Ecommerce.entity.Product) originalState;
                Object[] args = joinPoint.getArgs();
                for (Object arg : args) {
                    if (arg instanceof com.Ojt.Ecommerce.dto.ProductDTO) {
                        com.Ojt.Ecommerce.dto.ProductDTO dto = (com.Ojt.Ecommerce.dto.ProductDTO) arg;
                        // Basic fields
                        if (dto.getProductName() != null && !dto.getProductName().equals(beforeProduct.getProductName())) {
                            beforeChanges.put("productName", beforeProduct.getProductName());
                            afterChanges.put("productName", dto.getProductName());
                        }
                        if (dto.getProductCode() != null && !dto.getProductCode().equals(beforeProduct.getProductCode())) {
                            beforeChanges.put("productCode", beforeProduct.getProductCode());
                            afterChanges.put("productCode", dto.getProductCode());
                        }
                        if (dto.getPrice() != beforeProduct.getPrice()) {
                            beforeChanges.put("price", beforeProduct.getPrice());
                            afterChanges.put("price", dto.getPrice());
                        }
                        if (dto.getQuantity() != null && !dto.getQuantity().equals(beforeProduct.getQuantity())) {
                            beforeChanges.put("quantity", beforeProduct.getQuantity());
                            afterChanges.put("quantity", dto.getQuantity());
                        }
                        if (dto.getDescription() != null && !dto.getDescription().equals(beforeProduct.getDescription())) {
                            beforeChanges.put("description", beforeProduct.getDescription());
                            afterChanges.put("description", dto.getDescription());
                        }
                        if (dto.getStatus() != null && !dto.getStatus().equals(beforeProduct.getStatus())) {
                            beforeChanges.put("status", beforeProduct.getStatus());
                            afterChanges.put("status", dto.getStatus());
                        }
                        // Brand
                        Long beforeBrandId = beforeProduct.getBrand() != null ? beforeProduct.getBrand().getId() : null;
                        Long afterBrandId = null;
                        if (dto.getCategoryBrandPairs() != null && !dto.getCategoryBrandPairs().isEmpty()) {
                            afterBrandId = dto.getCategoryBrandPairs().get(0).getBrandId();
                        }
                        if (afterBrandId != null && !afterBrandId.equals(beforeBrandId)) {
                            beforeChanges.put("brandId", beforeBrandId);
                            afterChanges.put("brandId", afterBrandId);
                        }
                        // Categories
                        java.util.Set<Long> beforeCategoryIds = new java.util.HashSet<>();
                        if (beforeProduct.getProductCategories() != null) {
                            for (com.Ojt.Ecommerce.entity.ProductHasCategory phc : beforeProduct.getProductCategories()) {
                                if (phc.getCategory() != null) beforeCategoryIds.add(phc.getCategory().getId());
                            }
                        }
                        java.util.Set<Long> afterCategoryIds = new java.util.HashSet<>();
                        if (dto.getCategoryBrandPairs() != null) {
                            for (com.Ojt.Ecommerce.dto.CategoryBrandPair pair : dto.getCategoryBrandPairs()) {
                                if (pair.getCategoryId() != null) afterCategoryIds.add(pair.getCategoryId());
                            }
                        }
                        if (!beforeCategoryIds.equals(afterCategoryIds)) {
                            beforeChanges.put("categoryIds", beforeCategoryIds);
                            afterChanges.put("categoryIds", afterCategoryIds);
                        }
                        // Attributes
                        java.util.Map<Long, java.util.List<String>> beforeAttrs = new java.util.HashMap<>();
                        if (beforeProduct.getProductVariants() != null && !beforeProduct.getProductVariants().isEmpty()) {
                            for (com.Ojt.Ecommerce.entity.ProductVariant variant : beforeProduct.getProductVariants()) {
                                if (variant.getVariantAttributeValues() != null) {
                                    for (com.Ojt.Ecommerce.entity.VariantAttributeValue vav : variant.getVariantAttributeValues()) {
                                        if (vav.getAttributeValue() != null && vav.getAttributeValue().getAttribute() != null) {
                                            Long attrId = vav.getAttributeValue().getAttribute().getId();
                                            String value = vav.getAttributeValue().getValue();
                                            beforeAttrs.computeIfAbsent(attrId, k -> new java.util.ArrayList<>()).add(value);
                                        }
                                    }
                                }
                            }
                        }
                        java.util.Map<Long, java.util.List<String>> afterAttrs = new java.util.HashMap<>();
                        if (dto.getAttributes() != null) {
                            for (com.Ojt.Ecommerce.dto.AttributeAndValueDTO attr : dto.getAttributes()) {
                                if (attr.getAttributeId() != null && attr.getValues() != null) {
                                    java.util.List<String> values = new java.util.ArrayList<>();
                                    for (com.Ojt.Ecommerce.dto.AttributeValueDTO val : attr.getValues()) {
                                        values.add(val.getValue());
                                    }
                                    afterAttrs.put(attr.getAttributeId(), values);
                                }
                            }
                        }
                        if (!beforeAttrs.equals(afterAttrs)) {
                            beforeChanges.put("attributes", beforeAttrs);
                            afterChanges.put("attributes", afterAttrs);
                        }
                        // Variants
                        java.util.Map<Long, java.util.Map<String, Object>> beforeVariants = new java.util.HashMap<>();
                        if (beforeProduct.getProductVariants() != null) {
                            for (com.Ojt.Ecommerce.entity.ProductVariant variant : beforeProduct.getProductVariants()) {
                                java.util.Map<String, Object> vmap = new java.util.HashMap<>();
                                vmap.put("price", variant.getPrice());
                                vmap.put("stock", variant.getStock());
                                vmap.put("sku", variant.getStockKeeping());
                                beforeVariants.put(variant.getId() != null ? variant.getId().longValue() : null, vmap);
                            }
                        }
                        java.util.Map<Long, java.util.Map<String, Object>> afterVariants = new java.util.HashMap<>();
                        if (dto.getVariants() != null) {
                            for (com.Ojt.Ecommerce.dto.VariantDTO v : dto.getVariants()) {
                                java.util.Map<String, Object> vmap = new java.util.HashMap<>();
                                vmap.put("price", v.getPrice());
                                vmap.put("stock", v.getStock());
                                vmap.put("sku", v.getSku());
                                afterVariants.put(v.getId(), vmap);
                            }
                        }
                        if (!beforeVariants.equals(afterVariants)) {
                            beforeChanges.put("variants", beforeVariants);
                            afterChanges.put("variants", afterVariants);
                        }
                    }
                }
            }
            // CATEGORY
            if (logActivity.entityType().equals("CATEGORY") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.Category) {
                com.Ojt.Ecommerce.entity.Category beforeCategory = (com.Ojt.Ecommerce.entity.Category) originalState;
                Object[] args = joinPoint.getArgs();
                for (Object arg : args) {
                    if (arg instanceof com.Ojt.Ecommerce.dto.CategoryDTO) {
                        com.Ojt.Ecommerce.dto.CategoryDTO dto = (com.Ojt.Ecommerce.dto.CategoryDTO) arg;
                        if (dto.getCateNames() != null && !dto.getCateNames().isEmpty()) {
                            String beforeName = beforeCategory.getName();
                            String afterName = dto.getCateNames().get(0);
                            if (afterName != null && !afterName.equals(beforeName)) {
                                beforeChanges.put("name", beforeName);
                                afterChanges.put("name", afterName);
                            }
                        }
                        if (dto.getParentId() != null) {
                            Long beforeParentId = beforeCategory.getParent() != null ? beforeCategory.getParent().getId() : null;
                            if (!dto.getParentId().equals(beforeParentId)) {
                                beforeChanges.put("parentId", beforeParentId);
                                afterChanges.put("parentId", dto.getParentId());
                            }
                        }
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
                        if (dto.getBrandName() != null && !dto.getBrandName().equals(beforeBrand.getName())) {
                            beforeChanges.put("brandName", beforeBrand.getName());
                            afterChanges.put("brandName", dto.getBrandName());
                        }
                        if (dto.getImage() != null && !dto.getImage().equals(beforeBrand.getImage())) {
                            beforeChanges.put("image", beforeBrand.getImage());
                            afterChanges.put("image", dto.getImage());
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
                            beforeChanges.put("categoryIds", beforeCategoryIds);
                            afterChanges.put("categoryIds", afterCategoryIds);
                        }
                    }
                }
            }
            // ADDRESS
            if (logActivity.entityType().equals("ADDRESS") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.Address) {
                com.Ojt.Ecommerce.entity.Address beforeAddress = (com.Ojt.Ecommerce.entity.Address) originalState;
                Object[] args = joinPoint.getArgs();
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
            }
            
            // ORDER
            if (logActivity.entityType().equals("ORDER") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.UserOrder) {
                com.Ojt.Ecommerce.entity.UserOrder beforeOrder = (com.Ojt.Ecommerce.entity.UserOrder) originalState;
                Object[] args = joinPoint.getArgs();
                for (Object arg : args) {
                    if (arg instanceof com.Ojt.Ecommerce.dto.UserOrderListDTO) {
                        com.Ojt.Ecommerce.dto.UserOrderListDTO dto = (com.Ojt.Ecommerce.dto.UserOrderListDTO) arg;
                        // Get latest status from orderStatusHistory
                        String beforeStatus = null;
                        if (beforeOrder.getOrderStatusHistory() != null && !beforeOrder.getOrderStatusHistory().isEmpty()) {
                            com.Ojt.Ecommerce.entity.Status statusObj = beforeOrder.getOrderStatusHistory().get(beforeOrder.getOrderStatusHistory().size() - 1).getStatus();
                            beforeStatus = statusObj != null ? statusObj.getName().name() : null;
                        }
                        String afterStatus = dto.getStatus();
                        if (afterStatus != null && !afterStatus.equals(beforeStatus)) {
                            beforeChanges.put("status", beforeStatus);
                            afterChanges.put("status", afterStatus);
                        }
                    }
                }
            }
            // DISCOUNT
            if (logActivity.entityType().equals("DISCOUNT") && logActivity.actionType().equals("UPDATE") && originalState instanceof com.Ojt.Ecommerce.entity.Discount) {
                com.Ojt.Ecommerce.entity.Discount beforeDiscount = (com.Ojt.Ecommerce.entity.Discount) originalState;
                Object[] args = joinPoint.getArgs();
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
            }
            // Only add to changes if there are actual changes
            if (!afterChanges.isEmpty() || beforeChanges.containsKey("info")) {
                changes.put("before", beforeChanges);
                changes.put("after", afterChanges);
                changes.put("changedFields", afterChanges.keySet());
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
                description += " '" + entityName + "'";
            }
            if (entityId != null) {
                description += " (ID: " + entityId + ")";
            }
        }
        
        return description;
    }
    
    private String getRequestBody(HttpServletRequest request) {
        try {
            // Create a copy of the request to read the body
            ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
            
            // Read the body
            byte[] content = wrappedRequest.getContentAsByteArray();
            if (content.length > 0) {
                return new String(content, "UTF-8");
            }
        } catch (Exception e) {
            System.err.println("Error reading request body: " + e.getMessage());
        }
        return null;
    }
} 