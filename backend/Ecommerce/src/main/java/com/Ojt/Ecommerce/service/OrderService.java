package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.*;
import com.Ojt.Ecommerce.entity.*;
import com.Ojt.Ecommerce.repository.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

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
    @Transactional
    public UserOrder createOrder(UserOrderDTO dto) {
        try {
            UserOrder order = mapper.map(dto, UserOrder.class);

            User user = userRepo.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + dto.getUserId()));
            order.setUser(user);
            order.setAddress(addRepo.findById(dto.getAddressId())
                    .orElseThrow(() -> new RuntimeException("Address not found with ID: " + dto.getAddressId())));
            order.setDeliveryMethod(dmRepo.findById(dto.getDeliveryId())
                    .orElseThrow(() -> new RuntimeException("Delivery method not found with ID: " + dto.getDeliveryId())));

            if (dto.getCardId() != null) {
                SavedCard savedCard = savedCardRepo.findById(dto.getCardId())
                        .orElseThrow(() -> new RuntimeException("Saved card not found with ID: " + dto.getCardId()));
                order.setSavedCard(savedCard);
            }

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

            // Handle discount usage
            if (dto.getDiscountId() != null && order.getDiscount() != null) {
                UserCouponUsage usage = new UserCouponUsage();
                usage.setUser(user);
                usage.setDiscount(order.getDiscount());
                usage.setUsedAt(LocalDateTime.now());
                couponRepo.save(usage);
            }

            // Points calculation
            double totalAmount = dto.getCartItem().stream()
                    .mapToDouble(item -> item.getPrice() * item.getQuantity())
                    .sum();

            int earnedPoints = calculatePoints(totalAmount);

            user.setTotalPoints(user.getTotalPoints() == null ? earnedPoints : user.getTotalPoints() + earnedPoints);
            userRepo.save(user);

            UserPointHistory history = UserPointHistory.builder()
                    .user(user)
                    .order(savedOrder)
                    .points(earnedPoints)
                    .createdAt(LocalDateTime.now())
                    .build();
            pointRepo.save(history);

            return savedOrder;

        } catch (Exception e) {
            e.printStackTrace(); // or use a logger
            throw new RuntimeException("Failed to create order: " + e.getMessage(), e);
        }
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

            if (order.getDeliveryMethod() != null) {
                dto.setDeliveryMethod(order.getDeliveryMethod().getName());
                dto.setDeliveryFee(order.getDeliveryMethod().getFee());
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
            if (order.getDeliveryMethod() != null && order.getDeliveryMethod().getFee() != null) {
                total += order.getDeliveryMethod().getFee();
            }
            dto.setTotal(Math.round(total));

            return dto;
        }).collect(Collectors.toList());
    }

    public List<UserOrderListDTO> getAllOrders() {
        List<UserOrder> orders = repo.findAll();

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

            if (order.getDeliveryMethod() != null) {
                dto.setDeliveryMethod(order.getDeliveryMethod().getName());
                dto.setDeliveryFee(order.getDeliveryMethod().getFee());
            }

            List<OrderProductDTO> productDTOs = order.getOrderProducts().stream().map(p -> {
                OrderProductDTO pdto = new OrderProductDTO();
                pdto.setProductName(p.getProduct().getProductName());
                pdto.setQuantity(p.getQuantity());
                pdto.setUnitPrice(p.getUnitPrice());
                return pdto;
            }).collect(Collectors.toList());

            dto.setProducts(productDTOs);

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

                if (discount.getDiscountType() == DiscountType.PERCENTAGE) {
                    discountAmount = subtotal * discount.getDiscountValue();
                } else {
                    discountAmount = discount.getDiscountValue();
                }
                dto.setDiscountAmount(Math.round(discountAmount));
            } else {
                dto.setDiscountAmount(0L);
            }

            double total = subtotal - discountAmount;
            if (order.getDeliveryMethod() != null && order.getDeliveryMethod().getFee() != null) {
                total += order.getDeliveryMethod().getFee();
            }
            dto.setTotal(Math.round(total));

            User user = order.getUser();
            if (user != null) {
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

            Address address = order.getAddress();
            if (address != null) {
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
        }).collect(Collectors.toList());
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

        // Latest status
        OrderStatus latest = order.getOrderStatusHistory().stream()
                .max(Comparator.comparing(OrderStatus::getStatusDate))
                .orElse(null);
        if (latest != null) {
            dto.setStatus(latest.getStatus().getName().name());
        }

        // Status history
        List<StatusHistoryDTO> history = order.getOrderStatusHistory().stream()
                .map(s -> new StatusHistoryDTO(s.getStatus().getName().name(), s.getStatusDate()))
                .toList();
        dto.setStatusHistory(history);

        // Delivery
        if (order.getDeliveryMethod() != null) {
            dto.setDeliveryMethod(order.getDeliveryMethod().getName());
            dto.setDeliveryFee(order.getDeliveryMethod().getFee());
        }

        // Discount
        Discount discount = order.getDiscount();
        double discountAmount = 0.0;
        if (discount != null) {
            dto.setDiscountType(discount.getDiscountType().name());
            dto.setDiscountCode(discount.getCode());
            dto.setDiscountValue(discount.getDiscountValue());

            double subtotal = order.getOrderProducts().stream()
                    .mapToDouble(p -> p.getUnitPrice() * p.getQuantity())
                    .sum();

            discountAmount = switch (discount.getDiscountType()) {
                case PERCENTAGE -> subtotal * discount.getDiscountValue();
                case FIXED -> discount.getDiscountValue();
            };
            dto.setDiscountAmount(Math.round(discountAmount));
        } else {
            dto.setDiscountAmount(0L);
        }

        // Products
        List<OrderProductDTO> products = order.getOrderProducts().stream().map(p -> {
            OrderProductDTO pdto = new OrderProductDTO();
            pdto.setProductId(p.getId());
            pdto.setProductName(p.getProduct().getProductName());
            pdto.setQuantity(p.getQuantity());
            pdto.setUnitPrice(p.getUnitPrice());

            if (p.getProductVariant() != null) {
                String variantInfo = p.getProductVariant().getVariantAttributeValues().stream()
                        .map(v -> v.getAttributeValue().getAttribute().getName() + ": " + v.getAttributeValue().getValue())
                        .collect(Collectors.joining(", "));
                pdto.setVariantDetails(variantInfo);
            } else {
                pdto.setVariantDetails("Base Product");
            }

            return pdto;
        }).toList();
        dto.setProducts(products);

        // Subtotal & Total
        double subtotal = products.stream().mapToDouble(p -> p.getUnitPrice() * p.getQuantity()).sum();
        dto.setSubtotal(Math.round(subtotal));

        double total = subtotal - discountAmount;
        if (order.getDeliveryMethod() != null) {
            total += order.getDeliveryMethod().getFee();
        }
        dto.setTotal(Math.round(total));

        // Address
        Address addr = order.getAddress();
        if (addr != null) {
            AddressDTO a = new AddressDTO();
            a.setId(addr.getId());
            a.setAddress(addr.getAddress());
            a.setCity(addr.getCity());
            a.setState(addr.getState());
            a.setPostalCode(addr.getPostalCode());
            a.setCountry(addr.getCountry());
            a.setLatitude(addr.getLatitude());
            a.setLongitude(addr.getLongitude());
            a.setType(AddressType.valueOf(addr.getType().name()));
            a.setCreateUpdate(addr.getCreateUpdate());
            a.setUpdateDate(addr.getUpdateDate());
            dto.setAddress(a);
        }

        // User
        User user = order.getUser();
        if (user != null) {
            UserDTO u = new UserDTO();
            u.setId(user.getId());
            u.setName(user.getName());
            u.setEmail(user.getEmail());
            u.setGender(user.getGender());
            u.setDateOfBirth(user.getDateOfBirth());
            u.setPhoneNumber(user.getPhoneNumber());
            u.setCreatedDate(user.getCreatedDate());
            u.setTotalPoints(user.getTotalPoints());
            dto.setUser(u);
        }

        // After setting other fields in dto
        List<ReturnRequest> returnEntities = returnRequestRepo.findByOrderId(order.getId());

        List<ReturnRequestDTO> returnDTOs = returnEntities.stream().map(r -> {
            ReturnRequestDTO rdto = new ReturnRequestDTO();
            rdto.setId(r.getId());
            rdto.setOrderId(order.getId());
            rdto.setOrderProductId(r.getOrderProduct().getId());
            rdto.setReasonForReturn(r.getReasonForReturn());
            rdto.setReturnDetail(r.getReturnDetail());
            rdto.setStatus(r.getStatus().name());
            rdto.setRequestedAt(r.getRequestedAt());
            rdto.setCancelledAt(r.getCancelledAt());
            rdto.setDecisionAt(r.getDecisionAt());
            rdto.setAdminRemark(r.getAdminRemark());
            rdto.setImageUrls(r.getImages().stream().map(ReturnRequestImage::getImageUrl).toList());
            return rdto;
        }).toList();

        dto.setReturnRequests(returnDTOs);
        return dto;
    }

    public UserOrderListDTO getOrderById(Long orderId) {
        UserOrder order = repo.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found with ID: " + orderId));
        return convertToDTO(order);
    }
}
