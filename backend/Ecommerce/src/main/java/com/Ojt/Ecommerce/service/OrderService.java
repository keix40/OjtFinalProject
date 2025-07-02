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
        UserOrder order = mapper.map(dto, UserOrder.class);
        order.setStatus(PENDING);

        User user = userRepo.findById(dto.getUserId()).orElseThrow();
        order.setUser(user);
        order.setAddress(addRepo.findById(dto.getAddressId()).orElseThrow());
        order.setDeliveryMethod(dmRepo.findById(dto.getDeliveryId()).orElseThrow());

        if (dto.getDiscountId() != null) {
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
        if (dto.getDiscountId() != null) {
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

        int earnedPoints = calculatePoints(totalAmount);

        if (user.getTotalPoints() == null) {
            user.setTotalPoints(0);
        }

        user.setTotalPoints(user.getTotalPoints() + earnedPoints);
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
}
