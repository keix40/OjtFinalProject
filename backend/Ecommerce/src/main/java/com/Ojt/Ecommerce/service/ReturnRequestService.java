package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.RefundDTO;
import com.Ojt.Ecommerce.dto.ReturnRequestDTO;
import com.Ojt.Ecommerce.entity.*;
import com.Ojt.Ecommerce.repository.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReturnRequestService {

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

    public ReturnRequestDTO submitReturnRequest(Long orderId, Long orderProductId,
                                                ReturnReason reason, String detail,
                                                List<MultipartFile> files) {
        // Fetch Order and Product
        UserOrder order = userOrderRepo.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));

        UserOrderHasProduct orderProduct = orderProductRepo.findById(orderProductId)
                .orElseThrow(() -> new EntityNotFoundException("Order product not found"));

        // Create new ReturnRequest
        ReturnRequest request = new ReturnRequest();
        request.setOrder(order);
        request.setUser(order.getUser());
        request.setOrderProduct(orderProduct);
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

        // Save the ReturnRequest (cascade will save images)
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
        ReturnRequestDTO dto = new ReturnRequestDTO();
        dto.setId(request.getId());
        dto.setOrderId(orderId);
        dto.setUserId(request.getUser().getId());
        dto.setUserName(request.getUser().getName());
        dto.setOrderProductId(orderProductId);
        dto.setReasonForReturn(reason);
        dto.setReturnDetail(detail);
        dto.setStatus(request.getStatus().name());
        dto.setRequestedAt(request.getRequestedAt());
        dto.setImageUrls(imageEntities.stream()
                .map(ReturnRequestImage::getImageUrl)
                .toList());

        return dto;
    }

    public List<ReturnRequestDTO> getReturnsByOrder(Long orderId) {
        List<ReturnRequest> requests = returnRequestRepo.findByOrderId(orderId);
        return requests.stream().map(this::toDTO).toList();
    }

    private ReturnRequestDTO toDTO(ReturnRequest r) {
        ReturnRequestDTO dto = new ReturnRequestDTO();

        // Basic IDs
        dto.setId(r.getId());
        dto.setOrderId(r.getOrder().getId());
        dto.setOrderProductId(r.getOrderProduct().getId());
        dto.setUserId(r.getUser().getId());

        // User Info
        dto.setUserName(r.getUser().getName());

        // Order Info
        dto.setOrderCode(r.getOrder().getOrderCode());
        dto.setOrderDate(r.getOrder().getOrderDate());

        // Order Product Info
        dto.setProductName(r.getOrderProduct().getProduct().getProductName());

        if (r.getOrderProduct().getProductVariant() != null) {
            dto.setSku(r.getOrderProduct().getProductVariant().getStockKeeping());
        }

        dto.setQuantity(r.getOrderProduct().getQuantity());
        dto.setUnitPrice(r.getOrderProduct().getUnitPrice());
        dto.setTotalAmount(r.getOrderProduct().getQuantity() * r.getOrderProduct().getUnitPrice());

        //Card Info
        if (r.getOrder().getSavedCard() != null) {
            dto.setCardId(r.getOrder().getSavedCard().getId());
            dto.setCardNumber(r.getOrder().getSavedCard().getCardNumber());
        } else {
            dto.setCardId(null);
            dto.setCardNumber(null);
        }

        // Return Info
        dto.setReasonForReturn(r.getReasonForReturn());
        dto.setReturnDetail(r.getReturnDetail());
        dto.setStatus(r.getStatus().name());
        dto.setAdminRemark(r.getAdminRemark());

        // Timestamps
        dto.setRequestedAt(r.getRequestedAt());
        dto.setCancelledAt(r.getCancelledAt());
        dto.setDecisionAt(r.getDecisionAt());

        // Images
        dto.setImageUrls(r.getImages()
                .stream()
                .map(ReturnRequestImage::getImageUrl)
                .toList());

        Optional<Refund> refundOpt = refundRepo.findByReturnRequestId(r.getId());

        refundOpt.ifPresent(refund -> {
            dto.setRefundId(refund.getId());
            dto.setRefundAmount(refund.getRefundAmount());
            dto.setRefundDate(refund.getCompletedAt());
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
                .initiatedAt(LocalDateTime.now())
                .receiveCard(card)
                .build();

        refundRepo.save(refund);

        UserOrderHasProduct orderProduct = userOrderHasProductRepo.findById(request.getOrderProduct().getId())
                .orElseThrow(() -> new EntityNotFoundException("Order Product Entity not found"));

        if(orderProduct.getProductVariant() != null)
        {
            ProductVariant variant = productVariantRepo.findById(orderProduct.getProductVariant().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Product Variant not found"));

            variant.setStock(variant.getStock() + request.getOrderProduct().getQuantity());
            productVariantRepo.save(variant);
        }
        else
        {
            Product product = productRepo.findById(request.getOrderProduct().getProduct().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Product entity not found"));

            product.setQuantity(product.getQuantity() + request.getOrderProduct().getQuantity());
            productRepo.save(product);
        }
    }

    @Transactional
    public void processReplacement(Long returnRequestId, String adminRemark) {
        ReturnRequest request = returnRequestRepo.findById(returnRequestId)
                .orElseThrow(() -> new EntityNotFoundException("Return request not found"));

        if (request.getStatus() != ReturnStatus.APPROVED) {
            throw new IllegalStateException("Replacement can only be processed for approved return requests.");
        }

        Refund refund = Refund.builder()
                .returnRequest(request)
                .refundType(RefundType.REPLACEMENT)
                .refundAmount(BigDecimal.ZERO)
                .status(RefundStatus.COMPLETED)
                .adminRemark(adminRemark)
                .completedAt(LocalDateTime.now())
                .build();

        refundRepo.save(refund);

        UserOrder userOrder = orderRepo.findById(request.getOrder().getId())
                .orElseThrow(() -> new EntityNotFoundException("User Order entity not found."));

        Status pendingStatus = statusRepo.findByName(StatusType.PENDING)
                .orElseGet(() -> {
                    Status newStatus = new Status();
                    newStatus.setName(StatusType.PENDING);
                    return statusRepo.save(newStatus);
                });

        OrderStatus status = OrderStatus.builder()
                .status(pendingStatus)
                .userOrder(userOrder)
                .Refund(refund)
                .statusDate(LocalDateTime.now())
                .build();

        orderStatusRepo.save(status);
    }
}
