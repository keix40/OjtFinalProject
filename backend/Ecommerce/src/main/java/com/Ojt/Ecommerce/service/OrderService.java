package com.Ojt.Ecommerce.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

import com.Ojt.Ecommerce.dto.*;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Ojt.Ecommerce.entity.Address;
import com.Ojt.Ecommerce.entity.AddressType;
import com.Ojt.Ecommerce.entity.DeliveryService;
import com.Ojt.Ecommerce.entity.Discount;
import com.Ojt.Ecommerce.entity.DiscountRule;
import com.Ojt.Ecommerce.entity.DiscountType;
import com.Ojt.Ecommerce.entity.OrderStatus;
import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.entity.ProductVariant;
import com.Ojt.Ecommerce.entity.Refund;
import com.Ojt.Ecommerce.entity.ReturnRequestImage;
import com.Ojt.Ecommerce.entity.SavedCard;
import com.Ojt.Ecommerce.entity.Status;
import com.Ojt.Ecommerce.entity.StatusType;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.entity.UserCouponUsage;
import com.Ojt.Ecommerce.entity.UserOrder;
import com.Ojt.Ecommerce.entity.UserOrderHasProduct;
import com.Ojt.Ecommerce.entity.UserPointHistory;
import com.Ojt.Ecommerce.repository.AddressRepository;
import com.Ojt.Ecommerce.repository.DeliveryMethodRepository;
import com.Ojt.Ecommerce.repository.DeliveryServiceRepository;
import com.Ojt.Ecommerce.repository.DiscountRepository;
import com.Ojt.Ecommerce.repository.DiscountRuleRepository;
import com.Ojt.Ecommerce.repository.OrderRepository;
import com.Ojt.Ecommerce.repository.OrderStatusRepository;
import com.Ojt.Ecommerce.repository.ProductRepository;
import com.Ojt.Ecommerce.repository.ProductVariantRepository;
import com.Ojt.Ecommerce.repository.ReturnRequestRepository;
import com.Ojt.Ecommerce.repository.SavedCardRepository;
import com.Ojt.Ecommerce.repository.StatusRepository;
import com.Ojt.Ecommerce.repository.UserCouponUsageRepository;
import com.Ojt.Ecommerce.repository.UserOrderHasProductRepository;
import com.Ojt.Ecommerce.repository.UserPointHistoryRepository;
import com.Ojt.Ecommerce.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

@Service
public class OrderService {
    @Autowired
    private ModelMapper mapper;

    @Autowired
    private OrderRepository repo;

    @Autowired
    private DiscountRepository discountRepo;

    @Autowired
    private UserOrderHasProductRepository opRepo;

    @Autowired
    private UserCouponUsageRepository couponRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private DeliveryMethodRepository dmRepo;

    @Autowired
    private AddressRepository addRepo;

    @Autowired
    private ProductRepository proRepo;

    @Autowired
    private UserPointHistoryRepository pointRepo;

    @Autowired
    private ProductVariantRepository variantRepo;

    @Autowired
    private DiscountRuleRepository discountRuleRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private DeliveryServiceRepository deliveryServiceRepo;

    @Autowired
    private DistanceCalculatorService distanceCalculator; // You must create this

    // Method to ensure "First Time Buyer" discount exists
    private void ensureFirstTimeBuyerDiscountExists() {
        Discount firstTimeDiscount = discountRepo.findByName("First Time Buyer").orElse(null);
        if (firstTimeDiscount == null) {
            // Create the "First Time Buyer" discount if it doesn't exist
            firstTimeDiscount = new Discount();
            firstTimeDiscount.setName("First Time Buyer");
            firstTimeDiscount.setDescription("10% discount for first-time buyers");
            firstTimeDiscount.setDiscountType(DiscountType.PERCENTAGE);
            firstTimeDiscount.setDiscountValue(0.10); // 10% discount
            firstTimeDiscount.setStartDate(LocalDate.now());
            firstTimeDiscount.setEndDate(LocalDate.now().plusYears(10)); // Valid for 10 years
            firstTimeDiscount.setStatus(true);
            discountRepo.save(firstTimeDiscount);
        }
    }

    @Autowired
    private StatusRepository statusRepository;

    @Autowired
    private OrderStatusRepository orderStatusRepository;

    @Autowired
    private ReturnRequestRepository returnRequestRepo;

    @Autowired
    private SavedCardRepository savedCardRepo;

    //for discount
    public DiscountDTO getDiscountByCode(String code) {
        Discount discount = discountRepo.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Invalid coupon code"));

        boolean isValid = !discount.getAutoApply()
                && LocalDate.now().isAfter(discount.getStartDate().minusDays(1))
                && LocalDate.now().isBefore(discount.getEndDate().plusDays(1));

        return DiscountDTO.builder()
                .id(discount.getId())
                .code(discount.getCode())
                .name(discount.getName())
                .discountType(discount.getDiscountType())
                .discountValue(discount.getDiscountValue())
                .startDate(discount.getStartDate())
                .endDate(discount.getEndDate())
                .canUse(isValid)
                .build();
    }

    public boolean checkDiscountUsed(Long disId, Long userId){
        return couponRepo.checkDiscountUsed(userId,disId);
    }

    //for order
    // Create Order Method (fixed)
    @Transactional
    public UserOrder createOrder(UserOrderDTO dto) {
        ensureFirstTimeBuyerDiscountExists();

        try {
            UserOrder order = mapper.map(dto, UserOrder.class);

            User user = userRepo.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + dto.getUserId()));

            order.setUser(user);

            Address address = addRepo.findById(dto.getAddressId())
                    .orElseThrow(() -> new RuntimeException("Address not found with ID: " + dto.getAddressId()));
            order.setAddress(address);

            DeliveryService deliveryService = deliveryServiceRepo.findById(dto.getDeliveryServiceId())
                    .orElseThrow(() -> new RuntimeException("Delivery service not found"));
            order.setDeliveryService(deliveryService);

            // Calculate delivery fee by distance
            double distance = distanceCalculator.calculateDistance(
                    deliveryService.getBaseAddress().getLatitude().doubleValue(),
                    deliveryService.getBaseAddress().getLongitude().doubleValue(),
                    address.getLatitude().doubleValue(),
                    address.getLongitude().doubleValue()
            );

            BigDecimal deliveryFee = deliveryService.getFeePerKm().multiply(BigDecimal.valueOf(distance));
            order.setDeliveryFee(deliveryFee);

            // Set saved card if provided
            if (dto.getCardId() != null) {
                SavedCard savedCard = savedCardRepo.findById(dto.getCardId())
                        .orElseThrow(() -> new RuntimeException("Saved card not found with ID: " + dto.getCardId()));
                order.setSavedCard(savedCard);
            }

            // ===== FIRST-TIME BUYER DISCOUNT LOGIC =====
            boolean isFirstOrder = (user.getOrderCount() == null || user.getOrderCount() == 0);

            if (isFirstOrder) {
                if (user.getCreatedDate() != null && user.getCreatedDate().isBefore(LocalDateTime.now().minusDays(7))) {
                    System.out.println("User registered more than 7 days ago, not eligible for first time buyer discount");
                } else {
                    Discount firstTimeDiscount = discountRepo.findByName("First Time Buyer").orElse(null);
                    if (firstTimeDiscount != null && firstTimeDiscount.isStatus()
                            && LocalDate.now().isAfter(firstTimeDiscount.getStartDate().minusDays(1))
                            && LocalDate.now().isBefore(firstTimeDiscount.getEndDate().plusDays(1))) {

                        List<DiscountRule> userDiscountRules = discountRuleRepository.findActiveUserDiscounts(user.getId());
                        final Discount finalFirstTimeDiscount = firstTimeDiscount;
                        boolean hasActiveDiscount = userDiscountRules.stream()
                                .anyMatch(rule -> rule.getDiscount().getId().equals(finalFirstTimeDiscount.getId()));

                        if (hasActiveDiscount) {
                            order.setDiscount(firstTimeDiscount);
                            System.out.println("Applied First Time Buyer discount for user: " + user.getEmail());
                        }
                    }
                }
            }

            // If no first-time discount applied, apply manual discount if any
            if (dto.getDiscountId() != null) {
                order.setDiscount(discountRepo.findById(dto.getDiscountId()).orElse(null));
            }

            order.setOrderCode(generateUniqueOrderCode());
            order.setOrderDate(LocalDateTime.now());
            order.setUpdatedDate(LocalDateTime.now());

            UserOrder savedOrder = repo.save(order);

            // Ensure PENDING status exists; create if missing
            Status pendingStatus = statusRepository.findByName(StatusType.PENDING)
                    .orElseGet(() -> {
                        Status newStatus = new Status();
                        newStatus.setName(StatusType.PENDING);
                        return statusRepository.save(newStatus);
                    });

            OrderStatus initialStatus = OrderStatus.builder()
                    .userOrder(savedOrder)
                    .status(pendingStatus)
                    .statusDate(LocalDateTime.now())
                    .build();
            orderStatusRepository.save(initialStatus);

            // Process order items, reduce stock accordingly
            for (CartDTO item : dto.getCartItem()) {
                Product product = proRepo.findById(item.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found with ID: " + item.getProductId()));

                UserOrderHasProduct orderProduct = new UserOrderHasProduct();
                orderProduct.setUserOrder(savedOrder);
                orderProduct.setProduct(product);
                orderProduct.setQuantity(item.getQuantity());
                orderProduct.setUnitPrice(item.getPrice());

                if (item.getVariantId() != null) {
                    ProductVariant variant = variantRepo.findById(item.getVariantId())
                            .orElseThrow(() -> new RuntimeException("Variant not found with ID: " + item.getVariantId()));

                    if (variant.getStock() == null || variant.getStock() < item.getQuantity()) {
                        throw new RuntimeException("Insufficient stock for variant ID: " + item.getVariantId());
                    }

                    variant.setStock(variant.getStock() - item.getQuantity());
                    variantRepo.save(variant);
                    orderProduct.setProductVariant(variant);
                } else {
                    if (product.getQuantity() == null || product.getQuantity() < item.getQuantity()) {
                        throw new RuntimeException("Insufficient stock for product ID: " + item.getProductId());
                    }

                    product.setQuantity(product.getQuantity() - item.getQuantity());
                    proRepo.save(product);
                }

                opRepo.save(orderProduct);
            }

            // Save coupon usage if discount applied
            if (order.getDiscount() != null) {
                UserCouponUsage usage = new UserCouponUsage();
                usage.setUser(user);
                usage.setDiscount(order.getDiscount());
                usage.setUsedAt(LocalDateTime.now());
                couponRepo.save(usage);
            }

            // Calculate earned points and update user
            double totalAmount = dto.getCartItem().stream()
                    .mapToDouble(item -> item.getPrice() * item.getQuantity())
                    .sum();

            int earnedPoints = calculatePoints(totalAmount);

            Integer currentPoints = user.getTotalPoints() != null ? user.getTotalPoints() : 0;
            user.setTotalPoints(currentPoints + earnedPoints);

            // Update order count
            if (user.getOrderCount() == null) {
                user.setOrderCount(1);
            } else {
                user.setOrderCount(user.getOrderCount() + 1);
            }

            userRepo.save(user);

            // Save user point history
            UserPointHistory history = UserPointHistory.builder()
                    .user(user)
                    .order(savedOrder)
                    .points(earnedPoints)
                    .createdAt(LocalDateTime.now())
                    .build();
            pointRepo.save(history);

            notificationService.sendNotification(user.getEmail(), "Your order was successful");
            return savedOrder;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to create order: " + e.getMessage(), e);
        }
    }

    //add discount preivew by pmk july 9

    public OrderPreviewDTO previewOrder(UserOrderDTO dto) {
        OrderPreviewDTO preview = new OrderPreviewDTO();
        preview.setCartItems(dto.getCartItem());

        double subtotal = dto.getCartItem().stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();
        preview.setSubtotal(subtotal);

        String discountName = null;
        double discountAmount = 0.0;
        String discountReason = null;

        User user = userRepo.findById(dto.getUserId()).orElse(null);
        if (user != null) {
            boolean isFirstOrder = (user.getOrderCount() == null || user.getOrderCount() == 0);
            if (isFirstOrder) {
                if (user.getCreatedDate() != null && user.getCreatedDate().isBefore(LocalDateTime.now().minusDays(7))) {
                    System.out.println("User registered more than 7 days ago, not eligible for first time buyer discount");
                } else {
                    Discount firstTimeDiscount = discountRepo.findByName("First Time Buyer").orElse(null);
                    if (firstTimeDiscount != null && firstTimeDiscount.isStatus()
                            && LocalDate.now().isAfter(firstTimeDiscount.getStartDate().minusDays(1))
                            && LocalDate.now().isBefore(firstTimeDiscount.getEndDate().plusDays(1))) {

                        List<DiscountRule> userDiscountRules = discountRuleRepository.findActiveUserDiscounts(user.getId());
                        final Discount finalFirstTimeDiscount = firstTimeDiscount;
                        boolean hasActiveDiscount = userDiscountRules.stream()
                                .anyMatch(rule -> rule.getDiscount().getId().equals(finalFirstTimeDiscount.getId()));

                        if (hasActiveDiscount) {
                            discountName = firstTimeDiscount.getName();
                            discountReason = "First time buyer discount (auto-applied)";
                            if (firstTimeDiscount.getDiscountType() == DiscountType.PERCENTAGE) {
                                discountAmount = subtotal * firstTimeDiscount.getDiscountValue();
                            } else {
                                discountAmount = firstTimeDiscount.getDiscountValue();
                            }
                        }
                    }
                }
            }
        }

        if (discountAmount == 0.0 && dto.getDiscountId() != null) {
            Discount manualDiscount = discountRepo.findById(dto.getDiscountId()).orElse(null);
            if (manualDiscount != null && manualDiscount.isStatus()) {
                discountName = manualDiscount.getName();
                discountReason = "Manual discount applied";
                if (manualDiscount.getDiscountType() == DiscountType.PERCENTAGE) {
                    discountAmount = subtotal * manualDiscount.getDiscountValue();
                } else {
                    discountAmount = manualDiscount.getDiscountValue();
                }
            }
        }

        preview.setDiscountName(discountName);
        preview.setDiscountAmount(Math.round(discountAmount));
        preview.setDiscountReason(discountReason);

        double deliveryFee = 0.0;
        if (dto.getDeliveryServiceId() != null && dto.getAddressId() != null) {
            DeliveryService deliveryService = deliveryServiceRepo.findById(dto.getDeliveryServiceId()).orElse(null);
            Address userAddress = addRepo.findById(dto.getAddressId()).orElse(null);

            if (deliveryService != null && userAddress != null) {
                double distance = distanceCalculator.calculateDistance(
                        deliveryService.getBaseAddress().getLatitude().doubleValue(),
                        deliveryService.getBaseAddress().getLongitude().doubleValue(),
                        userAddress.getLatitude().doubleValue(),
                        userAddress.getLongitude().doubleValue()
                );
                deliveryFee = deliveryService.getFeePerKm().doubleValue() * distance;
            }
        }

        preview.setDeliveryFee(deliveryFee);
        preview.setTotal(Math.round(subtotal - discountAmount + deliveryFee));

        return preview;
    }
    public String generateUniqueOrderCode() {
        String code;
        do {
            code = generateRandomCode();
        } while (repo.existsByOrderCode(code));
        return code;
    }

    private String generateRandomCode() {
        char letter = (char) ('A' + new Random().nextInt(26));
        int number = 10000 + new Random().nextInt(90000);
        return "#" + letter + number;
    }

    private int calculatePoints(double totalAmount) {
        // Example: 1 point per 1000 MMK
        return (int) (totalAmount / 1000);
    }

    public List<UserOrderListDTO> getOrdersByUserId(Long userId) {
        List<UserOrder> orders = repo.findByUserId(userId);

        return orders.stream().map(order -> {
            UserOrderListDTO dto = new UserOrderListDTO();
            dto.setOrderId(order.getId());
            dto.setOrderCode(order.getOrderCode());
            dto.setOrderDate(order.getOrderDate());
            dto.setUpdatedDate(order.getUpdatedDate());

            // Set latest status
            List<OrderStatus> statusHistory = order.getOrderStatusHistory();
            if (!statusHistory.isEmpty()) {
                statusHistory.sort((s1, s2) -> s2.getStatusDate().compareTo(s1.getStatusDate()));
                dto.setStatus(statusHistory.get(0).getStatus().getName().toString());
                dto.setStatusHistory(statusHistory.stream()
                        .map(s -> new StatusHistoryDTO(s.getStatus().getName().toString(), s.getStatusDate()))
                        .collect(Collectors.toList()));
            }

            if (order.getDeliveryService() != null) {
                dto.setDeliveryService(order.getDeliveryService().getName());
                dto.setDeliveryFee(order.getDeliveryFee() != null ? order.getDeliveryFee().doubleValue() : 0.0);
            } else if (order.getDeliveryMethod() != null) {
                dto.setDeliveryMethod(order.getDeliveryMethod().getName());
                dto.setDeliveryFee(order.getDeliveryMethod().getFee() != null ? order.getDeliveryMethod().getFee().doubleValue() : 0.0);
            }

            Discount discount = order.getDiscount();
            double discountAmount = 0.0;

            if (discount != null) {
                if (discount.getDiscountType() != null) {
                    dto.setDiscountType(discount.getDiscountType().toString());
                }
                if (discount.getCode() != null) {
                    dto.setDiscountCode(discount.getCode());
                }
                if (discount.getDiscountValue() != null) {
                    dto.setDiscountValue(discount.getDiscountValue());
                    double subtotal = order.getOrderProducts().stream()
                            .mapToDouble(p -> p.getQuantity() * p.getUnitPrice())
                            .sum();
                    if (discount.getDiscountType() == DiscountType.PERCENTAGE) {
                        discountAmount = subtotal * discount.getDiscountValue();
                    } else {
                        discountAmount = discount.getDiscountValue();
                    }
                    dto.setDiscountAmount(Math.round(discountAmount));
                }
            } else {
                dto.setDiscountAmount(0L);
            }

            List<OrderProductDTO> productDTOs = order.getOrderProducts().stream().map(product -> {
                OrderProductDTO productDTO = new OrderProductDTO();
                productDTO.setProductName(product.getProduct().getProductName());
                productDTO.setQuantity(product.getQuantity());
                productDTO.setUnitPrice(product.getUnitPrice());

                if (product.getProductVariant() != null) {
                    String variantInfo = product.getProductVariant().getVariantAttributeValues().stream()
                            .map(vav -> vav.getAttributeValue().getAttribute().getName() + ": " + vav.getAttributeValue().getValue())
                            .collect(Collectors.joining(", "));
                    productDTO.setVariantDetails(variantInfo);
                } else {
                    productDTO.setVariantDetails("Base Product");
                }

                return productDTO;
            }).collect(Collectors.toList());

            dto.setProducts(productDTOs);

            double subtotal = order.getOrderProducts().stream()
                    .mapToDouble(p -> p.getQuantity() * p.getUnitPrice())
                    .sum();
            dto.setSubtotal(Math.round(subtotal));

            double total = subtotal - discountAmount;
            // Always add deliveryFee (from deliveryService or deliveryMethod) if present
            if (order.getDeliveryFee() != null) {
                total += order.getDeliveryFee().doubleValue();
            }
            dto.setTotal(Math.round(total));

            return dto;
        }).collect(Collectors.toList());
    }

    public List<UserOrderListDTO> getAllOrders() {
        List<UserOrder> orders = repo.findAll();
        return orders.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public boolean updateOrderStatus(Long orderId, String statusStr) {
        Optional<UserOrder> optionalOrder = repo.findById(orderId);
        if (optionalOrder.isEmpty()) return false;

        UserOrder order = optionalOrder.get();

        StatusType type = StatusType.valueOf(statusStr.toUpperCase());
        Status status = statusRepository.findByName(type)
                .orElseThrow(() -> new RuntimeException("Status not found"));

        OrderStatus orderStatus = OrderStatus.builder()
                .userOrder(order)
                .status(status)
                .statusDate(LocalDateTime.now())
                .build();

        orderStatusRepository.save(orderStatus);

        order.setUpdatedDate(LocalDateTime.now());
        repo.save(order);

        return true;
    }

    private UserOrderListDTO convertToDTO(UserOrder order) {
        UserOrderListDTO dto = new UserOrderListDTO();

        dto.setOrderId(order.getId());
        dto.setOrderCode(order.getOrderCode());
        dto.setOrderDate(order.getOrderDate());
        dto.setUpdatedDate(order.getUpdatedDate());

        // Latest status and history
        List<OrderStatus> statusHistory = order.getOrderStatusHistory();
        if (!statusHistory.isEmpty()) {
            statusHistory.sort((s1, s2) -> s2.getStatusDate().compareTo(s1.getStatusDate()));
            dto.setStatus(statusHistory.get(0).getStatus().getName().toString());
            dto.setStatusHistory(statusHistory.stream()
                    .map(s -> new StatusHistoryDTO(s.getStatus().getName().toString(), s.getStatusDate()))
                    .collect(Collectors.toList()));
        }

        // Delivery
        if (order.getDeliveryService() != null) {
            dto.setDeliveryService(order.getDeliveryService().getName());
            dto.setDeliveryFee(order.getDeliveryFee() != null ? order.getDeliveryFee().doubleValue() : 0.0);
        } else if (order.getDeliveryMethod() != null) {
            dto.setDeliveryMethod(order.getDeliveryMethod().getName());
            dto.setDeliveryFee(order.getDeliveryMethod().getFee() != null ? order.getDeliveryMethod().getFee().doubleValue() : 0.0);
        }

        // Order products
        List<OrderProductDTO> productDTOs = order.getOrderProducts().stream().map(p -> {
            OrderProductDTO pdto = new OrderProductDTO();
            pdto.setProductName(p.getProduct().getProductName());
            pdto.setQuantity(p.getQuantity());
            pdto.setUnitPrice(p.getUnitPrice());
            return pdto;
        }).collect(Collectors.toList());
        dto.setProducts(productDTOs);

        // Subtotal & Discount
        double subtotal = order.getOrderProducts().stream()
                .mapToDouble(p -> p.getQuantity() * p.getUnitPrice())
                .sum();
        dto.setSubtotal(Math.round(subtotal));

        Discount discount = order.getDiscount();
        double discountAmount = 0.0;
        if (discount != null) {
            if (discount.getDiscountType() != null) {
                dto.setDiscountType(discount.getDiscountType().toString());
            }
            if (discount.getCode() != null) {
                dto.setDiscountCode(discount.getCode());
            }
            dto.setDiscountValue(discount.getDiscountValue());

            discountAmount = discount.getDiscountType() == DiscountType.PERCENTAGE
                    ? subtotal * discount.getDiscountValue()
                    : discount.getDiscountValue();

            dto.setDiscountAmount(Math.round(discountAmount));
        } else {
            dto.setDiscountAmount(0L);
        }

        double total = subtotal - discountAmount;
        // Always add deliveryFee (from deliveryService or deliveryMethod) if present
        if (order.getDeliveryFee() != null) {
            total += order.getDeliveryFee().doubleValue();
        }
        dto.setTotal(Math.round(total));

        // Return requests with refund mapping
        List<ReturnRequestDTO> returnRequestDTOs = order.getReturnRequests().stream().map(rr -> {
            ReturnRequestDTO rrdto = new ReturnRequestDTO();
            rrdto.setId(rr.getId());
            rrdto.setOrderId(order.getId());
            rrdto.setOrderCode(order.getOrderCode());
            rrdto.setOrderDate(order.getOrderDate());

            if (rr.getOrderProduct() != null) {
                rrdto.setOrderProductId(rr.getOrderProduct().getId());
                rrdto.setProductName(rr.getOrderProduct().getProduct().getProductName());
                rrdto.setQuantity(rr.getOrderProduct().getQuantity());
                rrdto.setUnitPrice(rr.getOrderProduct().getUnitPrice());
                rrdto.setTotalAmount(rr.getOrderProduct().getQuantity() * rr.getOrderProduct().getUnitPrice());
            }

            if (rr.getUser() != null) {
                rrdto.setUserId(rr.getUser().getId());
                rrdto.setUserName(rr.getUser().getName());
            }

            if (order.getSavedCard() != null) {
                rrdto.setCardId(order.getSavedCard().getId());
                rrdto.setCardNumber(order.getSavedCard().getCardNumber());
            }

            rrdto.setReasonForReturn(rr.getReasonForReturn());
            rrdto.setReturnDetail(rr.getReturnDetail());
            rrdto.setStatus(rr.getStatus().toString());
            rrdto.setAdminRemark(rr.getAdminRemark());
            rrdto.setRequestedAt(rr.getRequestedAt());
            rrdto.setDecisionAt(rr.getDecisionAt());
            rrdto.setCancelledAt(rr.getCancelledAt());

            if (rr.getImages() != null && !rr.getImages().isEmpty()) {
                rrdto.setImageUrls(rr.getImages().stream()
                        .map(ReturnRequestImage::getImageUrl)
                        .collect(Collectors.toList()));
            }

            // Refund mapping
            if (rr.getRefund() != null) {
                Refund refund = rr.getRefund();
                rrdto.setRefundId(refund.getId());
                rrdto.setRefundAmount(refund.getRefundAmount());
                rrdto.setRefundAdminRemark(refund.getAdminRemark());
                rrdto.setInitiatedAt(refund.getInitiatedAt());
                rrdto.setCompletedAt(refund.getCompletedAt());
                rrdto.setRefundStatus(refund.getStatus() != null ? refund.getStatus().toString() : null);
                rrdto.setRefundType(refund.getRefundType() != null ? refund.getRefundType().toString() : null);
            }

            return rrdto;
        }).collect(Collectors.toList());
        dto.setReturnRequests(returnRequestDTOs);

        // User
        if (order.getUser() != null) {
            User user = order.getUser();
            UserDTO userDTO = new UserDTO();
            userDTO.setId(user.getId());
            userDTO.setName(user.getName());
            userDTO.setEmail(user.getEmail());
            userDTO.setDateOfBirth(user.getDateOfBirth());
            userDTO.setGender(user.getGender());
            userDTO.setPhoneNumber(user.getPhoneNumber());
            userDTO.setCreatedDate(user.getCreatedDate());
            userDTO.setTotalPoints(user.getTotalPoints());
            dto.setUser(userDTO);
        }

        // Address
        if (order.getAddress() != null) {
            Address address = order.getAddress();
            AddressDTO addressDTO = new AddressDTO();
            addressDTO.setId(address.getId());
            addressDTO.setAddress(address.getAddress());
            addressDTO.setCity(address.getCity());
            addressDTO.setState(address.getState());
            addressDTO.setPostalCode(address.getPostalCode());
            addressDTO.setCountry(address.getCountry());
            addressDTO.setLatitude(address.getLatitude());
            addressDTO.setLongitude(address.getLongitude());
            addressDTO.setType(AddressType.valueOf(address.getType().toString()));
            addressDTO.setCreateUpdate(address.getCreateUpdate());
            addressDTO.setUpdateDate(address.getUpdateDate());
            dto.setAddress(addressDTO);
        }

        return dto;
    }

    public UserOrderListDTO getOrderById(Long orderId) {
        UserOrder order = repo.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found with ID: " + orderId));
        return convertToDTO(order);
    }

    // Method to test first-time buyer discount functionality by pmk july 9
    public boolean isUserFirstTimeBuyer(Long userId) {
        User user = userRepo.findById(userId).orElse(null);
        if (user == null) return false;
        return (user.getOrderCount() == null || user.getOrderCount() == 0);
    }

    // Method to get user's discount eligibility
    public String getUserDiscountStatus(Long userId) {
        User user = userRepo.findById(userId).orElse(null);
        if (user == null) return "User not found";

        boolean isFirstOrder = (user.getOrderCount() == null || user.getOrderCount() == 0);
        if (isFirstOrder) {
            List<DiscountRule> userDiscountRules = discountRuleRepository.findActiveUserDiscounts(userId);
            if (!userDiscountRules.isEmpty()) {
                return "Eligible for First Time Buyer discount (10% off)";
            } else {
                return "First-time buyer but no discount rule assigned";
            }
        } else {
            return "Not eligible (order count: " + user.getOrderCount() + ")";
        }
    }
}
