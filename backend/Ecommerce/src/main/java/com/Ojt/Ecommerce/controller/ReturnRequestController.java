package com.Ojt.Ecommerce.controller;

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
@RequiredArgsConstructor
public class ReturnRequestController {

    private final ReturnRequestService returnRequestService;
    private final ObjectMapper objectMapper = new ObjectMapper();

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

    @PutMapping("/cancel/{id}")
    public ResponseEntity<String> cancelReturn(@PathVariable Long id) {
        boolean cancelled = returnRequestService.cancelReturnRequest(id);
        return cancelled
                ? ResponseEntity.ok("Cancelled successfully.")
                : ResponseEntity.badRequest().body("Return request is not in PENDING status or already cancelled.");
    }

    @GetMapping("/getallrequest")
    public ResponseEntity<List<ReturnRequestDTO>> getAllRequest(){
        List<ReturnRequestDTO> returnList = returnRequestService.findAllRequest();
        return ResponseEntity.ok(returnList);
    }

    @GetMapping("/getrequestbyid/{id}")
    public ResponseEntity<ReturnRequestDTO> getRequestById(@PathVariable Long id){
        return ResponseEntity.ok(returnRequestService.findRequestById(id));
    }

    @PostMapping("/approve")
    public ResponseEntity<String> approveReturnRequest(@RequestBody ApproveRejectRequest data) {
        returnRequestService.approveReturnRequest(data.getReturnRequestId(), data.getAdminRemark());
        return ResponseEntity.ok("Return request approved.");
    }

    @PostMapping("/reject")
    public ResponseEntity<String> rejectReturnRequest(@RequestBody ApproveRejectRequest data) {
        returnRequestService.rejectReturnRequest(data.getReturnRequestId(), data.getAdminRemark());
        return ResponseEntity.ok("Return request rejected.");
    }

    @PostMapping("/replacement")
    public ResponseEntity<String> processReplacement(@RequestBody ReplacementRequest data) {
        returnRequestService.processReplacement(data.getReturnRequestId(), data.getAdminRemark());
        return ResponseEntity.ok("Replacement processed.");
    }

    @PostMapping("/refund")
    public ResponseEntity<String> processRefund(@RequestBody RefundDTO dto){
        returnRequestService.processRefund(dto);
        return ResponseEntity.ok("Refund processed.");
    }
}
