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
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

import static com.Ojt.Ecommerce.entity.OrderStatus.PENDING;

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
        // Ensure the first-time buyer discount exists
        ensureFirstTimeBuyerDiscountExists(); //add for discount preview by pmk july 9
        
        UserOrder order = mapper.map(dto, UserOrder.class);
        order.setStatus(PENDING);

        User user = userRepo.findById(dto.getUserId()).orElseThrow();
        order.setUser(user);
        order.setAddress(addRepo.findById(dto.getAddressId()).orElseThrow());
        order.setDeliveryMethod(dmRepo.findById(dto.getDeliveryId()).orElseThrow());

        // ===== FIRST-TIME BUYER DISCOUNT LOGIC ===== (by pmk july 9)
        // Check if user is a first-time buyer (order count = 0 or null)
        boolean isFirstOrder = (user.getOrderCount() == null || user.getOrderCount() == 0);
        
        if (isFirstOrder) {
            // Only allow first time buyer discount if user registered within last 7 days
            if (user.getCreatedDate() != null && user.getCreatedDate().isBefore(LocalDateTime.now().minusDays(7))) {
                System.out.println("User registered more than 7 days ago, not eligible for first time buyer discount");
            } else {
            // Look for "First Time Buyer" discount in the database
            Discount firstTimeDiscount = discountRepo.findByName("First Time Buyer").orElse(null);
            if (firstTimeDiscount != null && firstTimeDiscount.isStatus()
                && LocalDate.now().isAfter(firstTimeDiscount.getStartDate().minusDays(1))
                && LocalDate.now().isBefore(firstTimeDiscount.getEndDate().plusDays(1))) {
                // Check if user has an active discount rule for this discount
                // This ensures the discount was properly assigned during registration
                List<DiscountRule> userDiscountRules = discountRuleRepository.findActiveUserDiscounts(user.getId());
                final Discount finalFirstTimeDiscount = firstTimeDiscount; // Make it final for lambda
                boolean hasActiveDiscount = userDiscountRules.stream()
                    .anyMatch(rule -> rule.getDiscount().getId().equals(finalFirstTimeDiscount.getId()));
                System.out.println("FirstTimeBuyer Discount: start=" + firstTimeDiscount.getStartDate() +
                        ", end=" + firstTimeDiscount.getEndDate() +
                        ", today=" + LocalDate.now());
                
                if (hasActiveDiscount) {
                    // Apply the first-time buyer discount automatically (10% off)
                    order.setDiscount(firstTimeDiscount);
                    System.out.println("Applied First Time Buyer discount for user: " + user.getEmail());
                }
            }
            }
        }
        // ===== END FIRST-TIME BUYER DISCOUNT LOGIC =====

        // If no first-time discount applied, use the manually selected discount
        if (order.getDiscount() == null && dto.getDiscountId() != null) {
            order.setDiscount(discountRepo.findById(dto.getDiscountId()).orElse(null));
        }

        order.setOrderCode(generateUniqueOrderCode());
        order.setOrderDate(LocalDateTime.now());
        order.setUpdatedDate(LocalDateTime.now());

        UserOrder savedOrder = repo.save(order);

        for (CartDTO item : dto.getCartItem()) {
            UserOrderHasProduct orderProduct = new UserOrderHasProduct();
            orderProduct.setUserOrder(savedOrder);
            orderProduct.setProduct(proRepo.findById(item.getProductId()).orElseThrow());

            // ✅ If variantId is present, reduce variant stock
            if (item.getVariantId() != null) {
                variantRepo.findById(item.getVariantId()).ifPresent(variant -> {
                    orderProduct.setProductVariant(variant);

                    if (variant.getStock() != null && variant.getStock() >= item.getQuantity()) {
                        variant.setStock(variant.getStock() - item.getQuantity());
                        variantRepo.save(variant);
                    } else {
                        throw new RuntimeException("Insufficient stock for variant ID: " + item.getVariantId());
                    }
                });
            } else {
                // ✅ If no variant, reduce base product stock
                Product product = proRepo.findById(item.getProductId()).orElseThrow();
                if (product.getQuantity() != null && product.getQuantity() >= item.getQuantity()) {
                    product.setQuantity(product.getQuantity() - item.getQuantity());
                    proRepo.save(product);
                } else {
                    throw new RuntimeException("Insufficient stock for product ID: " + item.getProductId());
                }
            }

            orderProduct.setQuantity(item.getQuantity());
            orderProduct.setUnitPrice(item.getPrice());
            opRepo.save(orderProduct);
        }

        // Save coupon usage if discount applied
        if (order.getDiscount() != null) { // update for discount by pmk july 9
            UserCouponUsage usage = new UserCouponUsage();
            usage.setUser(order.getUser());
            usage.setDiscount(order.getDiscount());
            usage.setUsedAt(LocalDateTime.now());
            couponRepo.save(usage);
        }

        // Earn points
        double totalAmount = dto.getCartItem().stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();

        // Calculate discount amount by pmk july 9
        double discountAmount = 0.0;
        if (order.getDiscount() != null) {
            Discount discount = order.getDiscount();
            if (discount.getDiscountValue() != null) {
                if (discount.getDiscountType() == DiscountType.PERCENTAGE) {
                    discountAmount = totalAmount * discount.getDiscountValue();
                } else {
                    discountAmount = discount.getDiscountValue();
                }
            }
        }

        int earnedPoints = calculatePoints(totalAmount - discountAmount);

        if (user.getTotalPoints() == null) {
            user.setTotalPoints(0);
        }

        user.setTotalPoints(user.getTotalPoints() + earnedPoints);
        // Add order count for First time buyer discount by pmk july 7
        if (user.getOrderCount() == null) {
            user.setOrderCount(1);
        } else {
            user.setOrderCount(user.getOrderCount() + 1);
        }
        userRepo.save(user);

        UserPointHistory history = UserPointHistory.builder()
                .user(user)
                .order(savedOrder)
                .points(earnedPoints)
                .createdAt(LocalDateTime.now())
                .build();
        pointRepo.save(history);

        return savedOrder;
    }

    //add discount preivew by pmk july 9
     
    public OrderPreviewDTO previewOrder(UserOrderDTO dto) {
        OrderPreviewDTO preview = new OrderPreviewDTO();
        preview.setCartItems(dto.getCartItem());

        // Calculate subtotal
        double subtotal = dto.getCartItem().stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();
        preview.setSubtotal(subtotal);

        // Default: no discount
        String discountName = null;
        double discountAmount = 0.0;
        String discountReason = null;

        // Fetch user
        User user = userRepo.findById(dto.getUserId()).orElse(null);
        if (user != null) {
            // Check if user is a first-time buyer (order count = 0 or null)
            boolean isFirstOrder = (user.getOrderCount() == null || user.getOrderCount() == 0);
            if (isFirstOrder) {
                // Only allow first time buyer discount if user registered within last 7 days
                if (user.getCreatedDate() != null && user.getCreatedDate().isBefore(LocalDateTime.now().minusDays(7))) {
                    System.out.println("User registered more than 7 days ago, not eligible for first time buyer discount");
                } else {
                // Look for "First Time Buyer" discount in the database
                Discount firstTimeDiscount = discountRepo.findByName("First Time Buyer").orElse(null);
                if (firstTimeDiscount != null && firstTimeDiscount.isStatus()
                    && LocalDate.now().isAfter(firstTimeDiscount.getStartDate().minusDays(1))
                    && LocalDate.now().isBefore(firstTimeDiscount.getEndDate().plusDays(1))) {
                    // Check if user has an active discount rule for this discount
                    List<DiscountRule> userDiscountRules = discountRuleRepository.findActiveUserDiscounts(user.getId());
                    final Discount finalFirstTimeDiscount = firstTimeDiscount;
                    boolean hasActiveDiscount = userDiscountRules.stream()
                        .anyMatch(rule -> rule.getDiscount().getId().equals(finalFirstTimeDiscount.getId()));
                    if (hasActiveDiscount) {
                        // Apply the first-time buyer discount automatically (10% off)
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
        // If not first time buyer, check for manually selected discount
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
        // Only round for display, not for calculation
        preview.setDiscountName(discountName);
        preview.setDiscountAmount(Math.round(discountAmount));
        preview.setDiscountReason(discountReason);

        // Delivery fee (if any)
        double deliveryFee = 0.0;
        if (dto.getDeliveryId() != null) {
            DeliveryMethod delivery = dmRepo.findById(dto.getDeliveryId()).orElse(null);
            if (delivery != null && delivery.getFee() != null) {
                deliveryFee = delivery.getFee();
            }
        }
        preview.setDeliveryFee(deliveryFee);

        // Final total: subtotal - discount + deliveryFee
        double total = subtotal - discountAmount + deliveryFee;
        preview.setTotal(Math.round(total));

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
            dto.setStatus(order.getStatus().toString());

            // Delivery Info
            if (order.getDeliveryMethod() != null) {
                dto.setDeliveryMethod(order.getDeliveryMethod().getName());
                dto.setDeliveryFee(order.getDeliveryMethod().getFee());
            }

            // Discount Info
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

                    // Calculate discount amount
                    double subtotal = order.getOrderProducts().stream()
                            .mapToDouble(p -> p.getQuantity() * p.getUnitPrice())
                            .sum();

                    if (discount.getDiscountType() == DiscountType.PERCENTAGE) {
                        discountAmount = subtotal * discount.getDiscountValue();
                    } else {
                        discountAmount = discount.getDiscountValue();
                    }

                    dto.setDiscountAmount(Math.round(discountAmount));
                } else {
                    dto.setDiscountAmount(0L);
                }
            } else {
                dto.setDiscountAmount(0L);
            }

            // Products
            List<OrderProductDTO> productDTOs = order.getOrderProducts().stream().map(product -> {
                OrderProductDTO productDTO = new OrderProductDTO();
                productDTO.setProductName(product.getProduct().getProductName());
                productDTO.setQuantity(product.getQuantity());
                productDTO.setUnitPrice(product.getUnitPrice());

                if (product.getProductVariant() != null) {
                    String variantInfo = product.getProductVariant().getVariantAttributeValues().stream()
                            .map(vav -> {
                                String attributeName = vav.getAttributeValue().getAttribute().getName(); // ✅ attribute name
                                String value = vav.getAttributeValue().getValue();                       // ✅ value
                                return attributeName + ": " + value;
                            })
                            .collect(Collectors.joining(", "));
                    productDTO.setVariantDetails(variantInfo);
                } else {
                    productDTO.setVariantDetails("Base Product");
                }

                return productDTO;
            }).collect(Collectors.toList());

            dto.setProducts(productDTOs);

            // Subtotal
            double subtotal = order.getOrderProducts().stream()
                    .mapToDouble(p -> p.getQuantity() * p.getUnitPrice())
                    .sum();
            dto.setSubtotal(Math.round(subtotal));

            // Total
            double total = subtotal - discountAmount;

            if (order.getDeliveryMethod() != null && order.getDeliveryMethod().getFee() != null) {
                total += order.getDeliveryMethod().getFee();
            }

            dto.setTotal(Math.round(total));

            return dto;
        }).collect(Collectors.toList());
    }

    public List<UserOrderListDTO> getAllOrders() {
        List<UserOrder> orders = repo.findAll(); // fetch all orders

        return orders.stream().map(order -> {
            UserOrderListDTO dto = new UserOrderListDTO();
            dto.setOrderId(order.getId());
            dto.setOrderCode(order.getOrderCode());
            dto.setOrderDate(order.getOrderDate());
            dto.setStatus(order.getStatus().toString());

            // Delivery Info
            if (order.getDeliveryMethod() != null) {
                dto.setDeliveryMethod(order.getDeliveryMethod().getName());
                dto.setDeliveryFee(order.getDeliveryMethod().getFee());
            }

            // Products
            List<OrderProductDTO> productDTOs = order.getOrderProducts().stream().map(p -> {
                OrderProductDTO pdto = new OrderProductDTO();
                pdto.setProductName(p.getProduct().getProductName());
                pdto.setQuantity(p.getQuantity());
                pdto.setUnitPrice(p.getUnitPrice());
                return pdto;
            }).collect(Collectors.toList());

            dto.setProducts(productDTOs);

            // Subtotal
            double subtotal = order.getOrderProducts().stream()
                    .mapToDouble(p -> p.getQuantity() * p.getUnitPrice())
                    .sum();
            dto.setSubtotal(Math.round(subtotal));

            // Discount Info
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

                double discountValue = discount.getDiscountValue();

                if (discount.getDiscountType() == DiscountType.PERCENTAGE) {
                    discountAmount = subtotal * discountValue;
                } else {
                    discountAmount = discountValue;
                }

                dto.setDiscountAmount(Math.round(discountAmount));
            } else {
                dto.setDiscountAmount(0L);
            }

            // Total
            double total = subtotal - discountAmount;
            if (order.getDeliveryMethod() != null) {
                total += order.getDeliveryMethod().getFee();
            }
            dto.setTotal(Math.round(total));

            // User Info
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

            // Address Info
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
        if (optionalOrder.isPresent()) {
            OrderStatus status = OrderStatus.valueOf(statusStr.toUpperCase());
            UserOrder order = optionalOrder.get();
            order.setUpdatedDate(LocalDateTime.now());
            order.setStatus(status);
            repo.save(order);
            return true;
        }
        return false;
    }
    private UserOrderListDTO convertToDTO(UserOrder order) {
        UserOrderListDTO dto = new UserOrderListDTO();

        dto.setOrderId(order.getId());
        dto.setOrderCode(order.getOrderCode());
        dto.setOrderDate(order.getOrderDate());
        dto.setUpdatedDate(order.getUpdatedDate());
        dto.setStatus(String.valueOf(order.getStatus()));

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
