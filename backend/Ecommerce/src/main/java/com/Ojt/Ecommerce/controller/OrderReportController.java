package com.Ojt.Ecommerce.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Ojt.Ecommerce.service.OrderReportService;

@RestController
@RequestMapping("/api/order-reports")
@CrossOrigin(origins = "http://localhost:4200")
public class OrderReportController {

    @Autowired
    private OrderReportService orderReportService;

    @GetMapping("/pdf")
    public ResponseEntity<ByteArrayResource> exportOrderReportToPDF() throws Exception {
        System.out.println("=== Order PDF Export Request Received ===");
        return exportOrderReportToPDFWithIds(null);
    }

    @PostMapping("/pdf/selected")
    public ResponseEntity<ByteArrayResource> exportSelectedOrdersToPDF(@RequestBody List<Long> orderIds) throws Exception {
        System.out.println("=== Selected Order PDF Export Request Received ===");
        System.out.println("✓ Selected Order IDs: " + orderIds);
        return exportOrderReportToPDFWithIds(orderIds);
    }

    private ResponseEntity<ByteArrayResource> exportOrderReportToPDFWithIds(List<Long> selectedOrderIds) throws Exception {
        System.out.println("=== Starting Order PDF Report Generation in Controller ===");
        byte[] reportBytes = orderReportService.generatePdfReport(selectedOrderIds);
        
        String fileName = "Britium_Gallery_Order_Report_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm")) + ".pdf";
        
        ByteArrayResource resource = new ByteArrayResource(reportBytes);
        
        System.out.println("✓ Order PDF report generated successfully. Size: " + reportBytes.length + " bytes");
        System.out.println("✓ File name: " + fileName);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(reportBytes.length)
            .body(resource);
    }

    @GetMapping("/csv")
    public ResponseEntity<ByteArrayResource> exportOrderReportToCSV() throws Exception {
        System.out.println("=== Order CSV Export Request Received ===");
        return exportOrderReportToCSVWithIds(null);
    }

    @PostMapping("/csv/selected")
    public ResponseEntity<ByteArrayResource> exportSelectedOrdersToCSV(@RequestBody List<Long> orderIds) throws Exception {
        System.out.println("=== Selected Order CSV Export Request Received ===");
        System.out.println("✓ Selected Order IDs: " + orderIds);
        return exportOrderReportToCSVWithIds(orderIds);
    }

    private ResponseEntity<ByteArrayResource> exportOrderReportToCSVWithIds(List<Long> selectedOrderIds) throws Exception {
        System.out.println("=== Starting Order CSV Report Generation in Controller ===");
        byte[] reportBytes = orderReportService.generateCsvReport(selectedOrderIds);
        
        String fileName = "Britium_Gallery_Order_Report_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm")) + ".csv";
        
        ByteArrayResource resource = new ByteArrayResource(reportBytes);
        
        System.out.println("✓ Order CSV report generated successfully. Size: " + reportBytes.length + " bytes");
        System.out.println("✓ File name: " + fileName);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
            .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .contentLength(reportBytes.length)
            .body(resource);
    }
} 