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

import com.Ojt.Ecommerce.service.ReturnReportService;

@RestController
@RequestMapping("/api/return-reports")
@CrossOrigin(origins = "http://localhost:4200")
public class ReturnReportController {

    @Autowired
    private ReturnReportService returnReportService;

    @GetMapping("/pdf")
    public ResponseEntity<ByteArrayResource> exportReturnReportToPDF() throws Exception {
        System.out.println("=== Return PDF Export Request Received ===");
        return exportReturnReportToPDFWithIds(null);
    }

    @PostMapping("/pdf/selected")
    public ResponseEntity<ByteArrayResource> exportSelectedReturnsToPDF(@RequestBody List<Long> returnIds) throws Exception {
        System.out.println("=== Selected Return PDF Export Request Received ===");
        System.out.println("✓ Selected Return IDs: " + returnIds);
        return exportReturnReportToPDFWithIds(returnIds);
    }

    private ResponseEntity<ByteArrayResource> exportReturnReportToPDFWithIds(List<Long> selectedReturnIds) throws Exception {
        System.out.println("=== Starting Return PDF Report Generation in Controller ===");
        byte[] reportBytes = returnReportService.generatePdfReport(selectedReturnIds);
        
        String fileName = "Britium_Gallery_Return_Report_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm")) + ".pdf";
        
        ByteArrayResource resource = new ByteArrayResource(reportBytes);
        
        System.out.println("✓ Return PDF report generated successfully. Size: " + reportBytes.length + " bytes");
        System.out.println("✓ File name: " + fileName);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(reportBytes.length)
            .body(resource);
    }

    @GetMapping("/csv")
    public ResponseEntity<ByteArrayResource> exportReturnReportToCSV() throws Exception {
        System.out.println("=== Return CSV Export Request Received ===");
        return exportReturnReportToCSVWithIds(null);
    }

    @PostMapping("/csv/selected")
    public ResponseEntity<ByteArrayResource> exportSelectedReturnsToCSV(@RequestBody List<Long> returnIds) throws Exception {
        System.out.println("=== Selected Return CSV Export Request Received ===");
        System.out.println("✓ Selected Return IDs: " + returnIds);
        return exportReturnReportToCSVWithIds(returnIds);
    }

    private ResponseEntity<ByteArrayResource> exportReturnReportToCSVWithIds(List<Long> selectedReturnIds) throws Exception {
        System.out.println("=== Starting Return CSV Report Generation in Controller ===");
        byte[] reportBytes = returnReportService.generateCsvReport(selectedReturnIds);
        
        String fileName = "Britium_Gallery_Return_Report_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm")) + ".csv";
        
        ByteArrayResource resource = new ByteArrayResource(reportBytes);
        
        System.out.println("✓ Return CSV report generated successfully. Size: " + reportBytes.length + " bytes");
        System.out.println("✓ File name: " + fileName);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
            .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .contentLength(reportBytes.length)
            .body(resource);
    }
} 