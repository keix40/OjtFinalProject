package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;
import com.Ojt.Ecommerce.dto.ApproveRejectRequest;
import com.Ojt.Ecommerce.dto.RefundDTO;
import com.Ojt.Ecommerce.dto.ReplacementRequest;
import com.Ojt.Ecommerce.dto.ReturnRequestDTO;
import com.Ojt.Ecommerce.entity.ReturnReason;
import com.Ojt.Ecommerce.service.ReturnRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.Ojt.Ecommerce.annotations.RequiresPermission;
import static com.Ojt.Ecommerce.constants.PermissionConstants.*;

import java.util.List;

@RestController
@RequestMapping("/returns")
@PermissionCategoryTag(value = "orders", name = "Order Management", icon = "fa-shopping-cart")
@RequiredArgsConstructor
public class ReturnRequestController {

    private final ReturnRequestService returnRequestService;

    @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReturnRequestDTO> submitReturnRequest(
            @RequestParam("orderId") Long orderId,
            @RequestParam("productId") Long orderProductId,
            @RequestParam("reason") ReturnReason reason,
            @RequestParam(value = "returnDetail", required = false) String detail,
            @RequestParam(value = "images", required = false) List<MultipartFile> files
    ) {
        ReturnRequestDTO dto = returnRequestService.submitReturnRequest(
                orderId, orderProductId, reason, detail, files != null ? files : List.of()
        );
        return ResponseEntity.ok(dto);
    }


    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<ReturnRequestDTO>> getReturnsByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(returnRequestService.getReturnsByOrder(orderId));
    }

    @PutMapping("/cancel/{id}")
    public ResponseEntity<String> cancelReturn(@PathVariable Long id) {
        boolean cancelled = returnRequestService.cancelReturnRequest(id);
        return cancelled
                ? ResponseEntity.ok("Cancelled successfully.")
                : ResponseEntity.badRequest().body("Return request is not in PENDING status or already cancelled.");
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

    @PostMapping("/approve")
    @RequiresPermission(value = REFUND_UPDATE, level = "basic", description = "Approve return request")
    public ResponseEntity<String> approveReturnRequest(@RequestBody ApproveRejectRequest data) {
        returnRequestService.approveReturnRequest(data.getReturnRequestId(), data.getAdminRemark());
        return ResponseEntity.ok("Return request approved.");
    }

    @PostMapping("/reject")
    @RequiresPermission(value = REFUND_UPDATE, level = "basic", description = "Reject return request")
    public ResponseEntity<String> rejectReturnRequest(@RequestBody ApproveRejectRequest data) {
        returnRequestService.rejectReturnRequest(data.getReturnRequestId(), data.getAdminRemark());
        return ResponseEntity.ok("Return request rejected.");
    }

    @PostMapping("/replacement")
    @RequiresPermission(value = REFUND_UPDATE, level = "basic", description = "Process replacement for return request")
    public ResponseEntity<String> processReplacement(@RequestBody ReplacementRequest data) {
        returnRequestService.processReplacement(data.getReturnRequestId(), data.getAdminRemark());
        return ResponseEntity.ok("Replacement processed.");
    }

    @PostMapping("/refund")
    @RequiresPermission(value = REFUND_UPDATE, level = "basic", description = "Process refund for return request")
    public ResponseEntity<String> processRefund(@RequestBody RefundDTO dto){
        returnRequestService.processRefund(dto);
        return ResponseEntity.ok("Refund processed.");
    }
}
