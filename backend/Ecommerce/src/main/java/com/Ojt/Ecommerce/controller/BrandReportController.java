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

import com.Ojt.Ecommerce.service.BrandReportService;

@RestController
@RequestMapping("/api/brand-reports")
@CrossOrigin(origins = "http://localhost:4200")
public class BrandReportController {

    @Autowired
    private BrandReportService brandReportService;

    @GetMapping("/pdf")
    public ResponseEntity<ByteArrayResource> exportBrandReportToPDF() throws Exception {
        System.out.println("=== Brand PDF Export Request Received ===");
        return exportBrandReportToPDFWithIds(null);
    }

    @PostMapping("/pdf/selected")
    public ResponseEntity<ByteArrayResource> exportSelectedBrandsToPDF(@RequestBody List<Long> brandIds) throws Exception {
        System.out.println("=== Selected Brand PDF Export Request Received ===");
        System.out.println("✓ Selected Brand IDs: " + brandIds);
        return exportBrandReportToPDFWithIds(brandIds);
    }

    private ResponseEntity<ByteArrayResource> exportBrandReportToPDFWithIds(List<Long> selectedBrandIds) throws Exception {
        System.out.println("=== Starting Brand PDF Report Generation in Controller ===");
        byte[] reportBytes = brandReportService.generatePdfReport(selectedBrandIds);
        
        String fileName = "Britium_Gallery_Brand_Report_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm")) + ".pdf";
        
        ByteArrayResource resource = new ByteArrayResource(reportBytes);
        
        System.out.println("✓ Brand PDF report generated successfully. Size: " + reportBytes.length + " bytes");
        System.out.println("✓ File name: " + fileName);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(reportBytes.length)
            .body(resource);
    }

    @GetMapping("/csv")
    public ResponseEntity<ByteArrayResource> exportBrandReportToCSV() throws Exception {
        System.out.println("=== Brand CSV Export Request Received ===");
        return exportBrandReportToCSVWithIds(null);
    }

    @PostMapping("/csv/selected")
    public ResponseEntity<ByteArrayResource> exportSelectedBrandsToCSV(@RequestBody List<Long> brandIds) throws Exception {
        System.out.println("=== Selected Brand CSV Export Request Received ===");
        System.out.println("✓ Selected Brand IDs: " + brandIds);
        return exportBrandReportToCSVWithIds(brandIds);
    }

    private ResponseEntity<ByteArrayResource> exportBrandReportToCSVWithIds(List<Long> selectedBrandIds) throws Exception {
        System.out.println("=== Starting Brand CSV Report Generation in Controller ===");
        byte[] reportBytes = brandReportService.generateCsvReport(selectedBrandIds);
        
        String fileName = "Britium_Gallery_Brand_Report_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm")) + ".csv";
        
        ByteArrayResource resource = new ByteArrayResource(reportBytes);
        
        System.out.println("✓ Brand CSV report generated successfully. Size: " + reportBytes.length + " bytes");
        System.out.println("✓ File name: " + fileName);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
            .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .contentLength(reportBytes.length)
            .body(resource);
    }
} 