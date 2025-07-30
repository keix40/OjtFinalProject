package com.Ojt.Ecommerce.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.Ojt.Ecommerce.dto.RefundDTO;
import com.Ojt.Ecommerce.dto.ReturnRequestDTO;
import com.Ojt.Ecommerce.dto.ReturnRequestProductDTO;
import com.Ojt.Ecommerce.entity.OrderStatus;
import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.entity.ProductVariant;
import com.Ojt.Ecommerce.entity.Refund;
import com.Ojt.Ecommerce.entity.RefundStatus;
import com.Ojt.Ecommerce.entity.RefundType;
import com.Ojt.Ecommerce.entity.ReturnReason;
import com.Ojt.Ecommerce.entity.ReturnRequest;
import com.Ojt.Ecommerce.entity.ReturnRequestImage;
import com.Ojt.Ecommerce.entity.ReturnRequestProduct;
import com.Ojt.Ecommerce.entity.ReturnStatus;
import com.Ojt.Ecommerce.entity.SavedCard;
import com.Ojt.Ecommerce.entity.Status;
import com.Ojt.Ecommerce.entity.StatusType;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.entity.UserOrder;
import com.Ojt.Ecommerce.entity.UserOrderHasProduct;
import com.Ojt.Ecommerce.entity.UserPointHistory;
import com.Ojt.Ecommerce.repository.OrderRepository;
import com.Ojt.Ecommerce.repository.OrderStatusRepository;
import com.Ojt.Ecommerce.repository.ProductRepository;
import com.Ojt.Ecommerce.repository.ProductVariantRepository;
import com.Ojt.Ecommerce.repository.RefundRepository;
import com.Ojt.Ecommerce.repository.ReturnRequestProductRepository;
import com.Ojt.Ecommerce.repository.ReturnRequestRepository;
import com.Ojt.Ecommerce.repository.SavedCardRepository;
import com.Ojt.Ecommerce.repository.StatusRepository;
import com.Ojt.Ecommerce.repository.UserOrderHasProductRepository;
import com.Ojt.Ecommerce.repository.UserPointHistoryRepository;
import com.Ojt.Ecommerce.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReturnRequestService {

    private static final Logger log = LoggerFactory.getLogger(ReturnRequestService.class);

    private final ReturnRequestRepository returnRequestRepo;
    private final OrderRepository userOrderRepo;
    private final UserOrderHasProductRepository orderProductRepo;
    private final FileStorageService fileStorageService;
    private final StatusRepository statusRepo;
    private final OrderStatusRepository orderStatusRepo;
    private final RefundRepository refundRepo;
    private final SavedCardRepository savedCardRepo;
    private final UserOrderHasProductRepository userOrderHasProductRepo;
    private final ProductVariantRepository productVariantRepo;
    private final ProductRepository productRepo;
    private final UserPointHistoryRepository userPointHistoryRepo;
    private final UserRepository userRepo;
    private final OrderRepository orderRepo;
    private final ReturnRequestProductRepository returnRequestProductRepo;

    @Transactional
    public ReturnRequestDTO submitReturnRequest(Long orderId, List<Long> orderProductIds,
                                                ReturnReason reason, String detail,
                                                List<Integer> quantities,
                                                List<MultipartFile> files) {
        try {
            log.info("submitReturnRequest called with orderId={}, orderProductIds={}, reason={}, detail={}, quantities={}, files.size={}",
                    orderId, orderProductIds, reason, detail, quantities, files != null ? files.size() : 0);
            // Validate orderProductIds are not null or empty
            if (orderProductIds == null || orderProductIds.isEmpty()) {
                throw new IllegalArgumentException("Please select at least one product to return.");
            }
            for (Long opId : orderProductIds) {
                if (opId == null) {
                    throw new IllegalArgumentException("Order product ID cannot be null. Please check your selection.");
                }
            }
            // Fetch Order
            UserOrder order = userOrderRepo.findById(orderId)
                    .orElseThrow(() -> new EntityNotFoundException("Order not found"));

            // Fetch all order products for this order
            List<UserOrderHasProduct> orderProducts = order.getOrderProducts();
            List<Long> validOrderProductIds = orderProducts.stream().map(UserOrderHasProduct::getId).toList();
            List<Long> invalidIds = orderProductIds.stream().filter(id -> !validOrderProductIds.contains(id)).toList();
            if (!invalidIds.isEmpty()) {
                throw new IllegalArgumentException("One or more selected products are invalid for this order. Please reselect.");
            }

            // Create new ReturnRequest
            ReturnRequest request = new ReturnRequest();
            request.setOrder(order);
            request.setUser(order.getUser());
            request.setReasonForReturn(reason);
            request.setReturnDetail(detail);
            request.setStatus(ReturnStatus.PENDING);
            request.setRequestedAt(LocalDateTime.now());

            // Handle uploaded files
            List<ReturnRequestImage> imageEntities = new ArrayList<>();
            for (MultipartFile file : files) {
                String imageUrl = fileStorageService.saveFile(file); // Save and get URL/path
                ReturnRequestImage image = new ReturnRequestImage();
                image.setImageUrl(imageUrl);
                image.setReturnRequest(request);
                imageEntities.add(image);
            }
            request.setImages(imageEntities);

            // Build and attach return products
            List<ReturnRequestProduct> returnProducts = new ArrayList<>();
            for (int i = 0; i < orderProductIds.size(); i++) {
                Long opId = orderProductIds.get(i);
                UserOrderHasProduct orderProduct = orderProductRepo.findById(opId)
                        .orElseThrow(() -> new EntityNotFoundException("Order product not found: " + opId));
                ReturnRequestProduct rrp = new ReturnRequestProduct();
                rrp.setOrderProduct(orderProduct);
                rrp.setReturnRequest(request); // set parent
                if (quantities != null && i < quantities.size()) {
                    rrp.setQuantity(quantities.get(i));
                } else {
                    rrp.setQuantity(orderProduct.getQuantity());
                }
                returnProducts.add(rrp);
            }
            request.setReturnRequestProducts(returnProducts);

            // Save the ReturnRequest (cascade will save images and products)
            returnRequestRepo.save(request);

            Status cancelledStatus = statusRepo.findByName(StatusType.CANCELLED)
                    .orElseThrow(() -> new EntityNotFoundException("Status CANCELLED not found"));

            OrderStatus cancelledStatusRecord = OrderStatus.builder()
                    .userOrder(order)
                    .status(cancelledStatus)
                    .statusDate(LocalDateTime.now())
                    .build();

            orderStatusRepo.save(cancelledStatusRecord);

            // Map to DTO
            return toDTO(request);
        } catch (Exception e) {
            log.error("Error in submitReturnRequest: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to submit return request: " + e.getMessage(), e);
        }
    }

    public List<ReturnRequestDTO> getReturnsByOrder(Long orderId) {
        List<ReturnRequest> requests = returnRequestRepo.findByOrderId(orderId);
        return requests.stream().map(this::toDTO).toList();
    }

    private ReturnRequestDTO toDTO(ReturnRequest r) {
        ReturnRequestDTO dto = new ReturnRequestDTO();
        dto.setId(r.getId());
        dto.setOrderId(r.getOrder().getId());
        dto.setUserId(r.getUser().getId());
        dto.setUserName(r.getUser().getName());
        dto.setOrderCode(r.getOrder().getOrderCode());
        dto.setOrderDate(r.getOrder().getOrderDate());
        if (r.getOrder().getSavedCard() != null) {
            dto.setCardId(r.getOrder().getSavedCard().getId());
            dto.setCardNumber(r.getOrder().getSavedCard().getCardNumber());
        } else {
            dto.setCardId(null);
            dto.setCardNumber(null);
        }
        dto.setReasonForReturn(r.getReasonForReturn());
        dto.setReturnDetail(r.getReturnDetail());
        dto.setStatus(r.getStatus().name());
        dto.setAdminRemark(r.getAdminRemark());
        dto.setRequestedAt(r.getRequestedAt());
        dto.setCancelledAt(r.getCancelledAt());
        dto.setDecisionAt(r.getDecisionAt());
        dto.setImageUrls(r.getImages()
                .stream()
                .map(ReturnRequestImage::getImageUrl)
                .toList());
        // Map products
        List<ReturnRequestProductDTO> productDTOs = r.getReturnRequestProducts().stream().map(rrp -> {
            ReturnRequestProductDTO p = new ReturnRequestProductDTO();
            p.setId(rrp.getId());
            p.setOrderProductId(rrp.getOrderProduct().getId());
            p.setProductName(rrp.getOrderProduct().getProduct().getProductName());
            if (rrp.getOrderProduct().getProductVariant() != null) {
                p.setSku(rrp.getOrderProduct().getProductVariant().getStockKeeping());
            }
            p.setQuantity(rrp.getQuantity());
            p.setUnitPrice(rrp.getOrderProduct().getUnitPrice());
            p.setTotalAmount(rrp.getQuantity() * rrp.getOrderProduct().getUnitPrice());
            p.setProductRemark(rrp.getProductRemark());
            return p;
        }).toList();
        dto.setProducts(productDTOs);
        Optional<Refund> refundOpt = refundRepo.findByReturnRequestId(r.getId());
        refundOpt.ifPresent(refund -> {
            dto.setRefundId(refund.getId());
            dto.setRefundAmount(refund.getRefundAmount());
            dto.setInitiatedAt(refund.getInitiatedAt());
            dto.setCompletedAt(refund.getCompletedAt());
            dto.setRefundStatus(String.valueOf(refund.getRefundType()));
            dto.setRefundAdminRemark(refund.getAdminRemark());
        });
        return dto;
    }

    @Transactional
    public boolean cancelReturnRequest(Long returnRequestId) {
        ReturnRequest request = returnRequestRepo.findById(returnRequestId)
                .orElseThrow(() -> new EntityNotFoundException("Return request not found"));

        if (request.getStatus() != ReturnStatus.PENDING) {
            return false;
        }

        request.setStatus(ReturnStatus.CANCELLED);
        request.setCancelledAt(LocalDateTime.now());
        returnRequestRepo.save(request);
        return true;
    }

    public List<ReturnRequestDTO> findAllRequest() {
        List<ReturnRequest> requests = returnRequestRepo.findAll();

        return requests.stream()
                .map(this::toDTO)      // assuming you have your toDTO method in the same class
                .collect(Collectors.toList());
    }

    public ReturnRequestDTO findRequestById(Long id) {
        ReturnRequest requests = returnRequestRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("return request not found"));

        return toDTO(requests);
    }

    @Transactional
    public void approveReturnRequest(Long returnRequestId, String adminRemark) {
        ReturnRequest request = returnRequestRepo.findById(returnRequestId)
                .orElseThrow(() -> new EntityNotFoundException("Return request not found"));

        if (request.getStatus() != ReturnStatus.PENDING) {
            throw new IllegalStateException("Return request is not pending and cannot be approved");
        }

        request.setStatus(ReturnStatus.APPROVED);
        request.setAdminRemark(adminRemark);
        request.setDecisionAt(LocalDateTime.now());
        returnRequestRepo.save(request);

        UserPointHistory userPointHistory = userPointHistoryRepo.findByOrderId(request.getOrder().getId());
        userPointHistory.setStatus(0);
        userPointHistoryRepo.save(userPointHistory);

        User user = userRepo.findById(userPointHistory.getUser().getId())
                .orElseThrow(() -> new EntityNotFoundException("User Entity is not found"));
        user.setTotalPoints(user.getTotalPoints() - userPointHistory.getPoints());
        userRepo.save(user);
    }

    @Transactional
    public void rejectReturnRequest(Long returnRequestId, String adminRemark) {
        ReturnRequest request = returnRequestRepo.findById(returnRequestId)
                .orElseThrow(() -> new EntityNotFoundException("Return request not found"));

        if (request.getStatus() != ReturnStatus.PENDING) {
            throw new IllegalStateException("Return request is not pending and cannot be rejected");
        }

        request.setStatus(ReturnStatus.REJECTED);
        request.setAdminRemark(adminRemark);
        request.setDecisionAt(LocalDateTime.now());
        returnRequestRepo.save(request);
    }

    @Transactional
    public void processRefund(RefundDTO refundDTO) {
        ReturnRequest request = returnRequestRepo.findById(refundDTO.getReturnRequestId())
                .orElseThrow(() -> new EntityNotFoundException("Return request not found"));

        if (request.getStatus() != ReturnStatus.APPROVED) {
            throw new IllegalStateException("Refund can only be processed for approved return requests.");
        }
        SavedCard card = savedCardRepo.findById(refundDTO.getReceiveCardId())
                .orElseThrow(() -> new EntityNotFoundException("Save card not found"));

        Refund refund = Refund.builder()
                .returnRequest(request)
                .refundType(RefundType.MONEY_REFUND)
                .refundAmount(refundDTO.getRefundAmount() != null ? refundDTO.getRefundAmount() : BigDecimal.ZERO)
                .status(refundDTO.getStatus() != null ? refundDTO.getStatus() : RefundStatus.COMPLETED)
                .adminRemark(refundDTO.getAdminRemark())
                .completedAt(LocalDateTime.now())
                .initiatedAt(LocalDateTime.now())
                .receiveCard(card)
                .build();

        refundRepo.save(refund);

        // Update stock for all returned products and set status to 2 (refunded/returned)
        double totalRefundAmount = 0.0;
        for (ReturnRequestProduct rrp : request.getReturnRequestProducts()) {
            UserOrderHasProduct orderProduct = rrp.getOrderProduct();
            // Set status to 2 (refunded/returned)
            orderProduct.setStatus(2); // 2 = RETURNED
            userOrderHasProductRepo.save(orderProduct);
            // Only re-add stock/quantity if reason is CHANGED_MIND or WRONG_ITEM_DELIVERED
            if (request.getReasonForReturn() == ReturnReason.CHANGED_MIND || request.getReasonForReturn() == ReturnReason.WRONG_ITEM_DELIVERED) {
                if(orderProduct.getProductVariant() != null) {
                    ProductVariant variant = productVariantRepo.findById(orderProduct.getProductVariant().getId())
                            .orElseThrow(() -> new EntityNotFoundException("Product Variant not found"));
                    variant.setStock(variant.getStock() + rrp.getQuantity());
                    productVariantRepo.save(variant);
                } else {
                    Product product = productRepo.findById(orderProduct.getProduct().getId())
                            .orElseThrow(() -> new EntityNotFoundException("Product entity not found"));
                    product.setQuantity(product.getQuantity() + rrp.getQuantity());
                    productRepo.save(product);
                }
            }
            // Calculate refund amount for points deduction
            if (orderProduct.getUnitPrice() != null && rrp.getQuantity() != null) {
                totalRefundAmount += orderProduct.getUnitPrice() * rrp.getQuantity();
            }
        }
        // Deduct points from user
        User user = request.getUser();
        int pointsToDeduct = (int) (totalRefundAmount / 1000);
        if (pointsToDeduct > 0) {
            Integer currentPoints = user.getTotalPoints() != null ? user.getTotalPoints() : 0;
            int newPoints = Math.max(0, currentPoints - pointsToDeduct);
            user.setTotalPoints(newPoints);
            userRepo.save(user);
            // Log point deduction
            UserPointHistory history = UserPointHistory.builder()
                    .user(user)
                    .order(request.getOrder())
                    .points(-pointsToDeduct)
                    .createdAt(LocalDateTime.now())
                    .build();
            userPointHistoryRepo.save(history);
        }
        // No direct totalAmount field to update on UserOrder. The order management page should recalculate the total as the sum of all UserOrderHasProduct rows with status != RETURNED.
    }

    @Transactional
    public void processReplacement(Long returnRequestId, String adminRemark) {
        // Step 1: Find ReturnRequest
        ReturnRequest request = returnRequestRepo.findById(returnRequestId)
                .orElseThrow(() -> new EntityNotFoundException("Return request not found with ID: " + returnRequestId));

        // Step 2: Ensure status is APPROVED
        if (request.getStatus() != ReturnStatus.APPROVED) {
            throw new IllegalStateException("Replacement can only be processed for approved return requests.");
        }

        // Step 3: Safety check: associated order must not be null
        if (request.getOrder() == null) {
            throw new IllegalStateException("Associated order not found in return request.");
        }

        // Step 4: Create Refund entity with REPLACEMENT type
        Refund refund = Refund.builder()
                .returnRequest(request)
                .refundType(RefundType.REPLACEMENT)
                .refundAmount(BigDecimal.ZERO)
                .status(RefundStatus.APPROVED)
                .adminRemark(adminRemark != null ? adminRemark : "") // avoid null
                .initiatedAt(LocalDateTime.now())
                .build();

        refundRepo.save(refund);

        // Step 5: Fetch UserOrder from database
        UserOrder userOrder = orderRepo.findById(request.getOrder().getId())
                .orElseThrow(() -> new EntityNotFoundException("User order not found for return request."));

        // Step 6: Get or create 'PENDING' status
        Status pendingStatus = statusRepo.findByName(StatusType.PENDING)
                .orElseGet(() -> {
                    Status newStatus = new Status();
                    newStatus.setName(StatusType.PENDING);
                    return statusRepo.save(newStatus);
                });

        // Step 7: Create OrderStatus with refund link
        OrderStatus status = OrderStatus.builder()
                .status(pendingStatus)
                .userOrder(userOrder)
                .Refund(refund)
                .statusDate(LocalDateTime.now())
                .build();

        orderStatusRepo.save(status);
        // If any product-specific logic is needed, loop through request.getReturnRequestProducts()
    }
}
