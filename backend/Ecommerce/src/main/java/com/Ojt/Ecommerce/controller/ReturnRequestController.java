package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;
import com.Ojt.Ecommerce.dto.ApproveRejectRequest;
import com.Ojt.Ecommerce.dto.RefundDTO;
import com.Ojt.Ecommerce.dto.ReplacementRequest;
import com.Ojt.Ecommerce.dto.ReturnRequestDTO;
import com.Ojt.Ecommerce.dto.ReturnRequestProductDTO;
import com.Ojt.Ecommerce.entity.ReturnReason;
import com.Ojt.Ecommerce.service.ReturnRequestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.Ojt.Ecommerce.annotations.RequiresPermission;
import com.Ojt.Ecommerce.annotations.LogActivity;
import static com.Ojt.Ecommerce.constants.PermissionConstants.*;

import java.util.List;

// New DTO for submit request
class SubmitReturnRequest {
    public Long orderId;
    public List<Long> orderProductIds;
    public ReturnReason reason;
    public String returnDetail;
    public List<Integer> quantities; // optional, if partial returns allowed
}

@RestController
@RequestMapping("/returns")
@PermissionCategoryTag(value = "orders", name = "Order Management", icon = "fa-shopping-cart")
@RequiredArgsConstructor
public class ReturnRequestController {

    private final ReturnRequestService returnRequestService;
    private final com.Ojt.Ecommerce.repository.ReturnRequestRepository returnRequestRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @LogActivity(actionType = "CREATE", entityType = "RETURN_REQUEST", description = "Submitted return request", severityLevel = "MEDIUM")
    @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReturnRequestDTO> submitReturnRequest(
            @RequestPart("data") String data,
            @RequestPart(value = "images", required = false) List<MultipartFile> files
    ) throws Exception {
        SubmitReturnRequest submitData = objectMapper.readValue(data, SubmitReturnRequest.class);
        ReturnRequestDTO dto = returnRequestService.submitReturnRequest(
                submitData.orderId, submitData.orderProductIds, submitData.reason, submitData.returnDetail, submitData.quantities, files != null ? files : List.of()
        );
        return ResponseEntity.ok(dto);
    }


    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<ReturnRequestDTO>> getReturnsByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(returnRequestService.getReturnsByOrder(orderId));
    }

    @LogActivity(actionType = "UPDATE", entityType = "RETURN_REQUEST", description = "Cancelled return request", severityLevel = "MEDIUM", entityIdParam = "id", logChanges = true)
    @PutMapping("/cancel/{id}")
    public ResponseEntity<?> cancelReturn(@PathVariable Long id) {
        boolean cancelled = returnRequestService.cancelReturnRequest(id);
        if (cancelled) {
            // Return the updated return request entity for logging
            com.Ojt.Ecommerce.entity.ReturnRequest updatedReturnRequest = returnRequestRepository.findById(id).orElse(null);
            return ResponseEntity.ok(updatedReturnRequest);
        } else {
            return ResponseEntity.badRequest().body("Return request is not in PENDING status or already cancelled.");
        }
    }

    @GetMapping("/getallrequest")
    @RequiresPermission(value = REFUND_VIEW, level = "basic", description = "View all return requests")
    public ResponseEntity<List<ReturnRequestDTO>> getAllRequest(){
        List<ReturnRequestDTO> returnList = returnRequestService.findAllRequest();
        return ResponseEntity.ok(returnList);
    }

    @GetMapping("/getrequestbyid/{id}")
    public ResponseEntity<ReturnRequestDTO> getRequestById(@PathVariable Long id){
        return ResponseEntity.ok(returnRequestService.findRequestById(id));
    }

    @LogActivity(actionType = "UPDATE", entityType = "RETURN_REQUEST", description = "Approved return request", severityLevel = "HIGH", entityIdParam = "data.returnRequestId", logChanges = true)
    @PostMapping("/approve")
    @RequiresPermission(value = REFUND_UPDATE, level = "basic", description = "Approve return request")
    public ResponseEntity<?> approveReturnRequest(@RequestBody ApproveRejectRequest data) {
        returnRequestService.approveReturnRequest(data.getReturnRequestId(), data.getAdminRemark());
        // Return the updated return request entity for logging
        com.Ojt.Ecommerce.entity.ReturnRequest updatedReturnRequest = returnRequestRepository.findById(data.getReturnRequestId()).orElse(null);
        return ResponseEntity.ok(updatedReturnRequest);
    }

    @LogActivity(actionType = "UPDATE", entityType = "RETURN_REQUEST", description = "Rejected return request", severityLevel = "HIGH", entityIdParam = "data.returnRequestId", logChanges = true)
    @PostMapping("/reject")
    @RequiresPermission(value = REFUND_UPDATE, level = "basic", description = "Reject return request")
    public ResponseEntity<?> rejectReturnRequest(@RequestBody ApproveRejectRequest data) {
        returnRequestService.rejectReturnRequest(data.getReturnRequestId(), data.getAdminRemark());
        // Return the updated return request entity for logging
        com.Ojt.Ecommerce.entity.ReturnRequest updatedReturnRequest = returnRequestRepository.findById(data.getReturnRequestId()).orElse(null);
        return ResponseEntity.ok(updatedReturnRequest);
    }

    @LogActivity(actionType = "UPDATE", entityType = "RETURN_REQUEST", description = "Processed replacement for return request", severityLevel = "HIGH", entityIdParam = "data.returnRequestId", logChanges = true)
    @PostMapping("/replacement")
    @RequiresPermission(value = REFUND_UPDATE, level = "basic", description = "Process replacement for return request")
    public ResponseEntity<?> processReplacement(@RequestBody ReplacementRequest data) {
        returnRequestService.processReplacement(data.getReturnRequestId(), data.getAdminRemark());
        // Return the updated return request entity for logging
        com.Ojt.Ecommerce.entity.ReturnRequest updatedReturnRequest = returnRequestRepository.findById(data.getReturnRequestId()).orElse(null);
        return ResponseEntity.ok(updatedReturnRequest);
    }

    @LogActivity(actionType = "UPDATE", entityType = "RETURN_REQUEST", description = "Processed refund for return request", severityLevel = "HIGH", entityIdParam = "dto.returnRequestId", logChanges = true)
    @PostMapping("/refund")
    @RequiresPermission(value = REFUND_UPDATE, level = "basic", description = "Process refund for return request")
    public ResponseEntity<?> processRefund(@RequestBody RefundDTO dto){
        returnRequestService.processRefund(dto);
        // Return the updated return request entity for logging
        com.Ojt.Ecommerce.entity.ReturnRequest updatedReturnRequest = returnRequestRepository.findById(dto.getReturnRequestId()).orElse(null);
        return ResponseEntity.ok(updatedReturnRequest);
    }
}
