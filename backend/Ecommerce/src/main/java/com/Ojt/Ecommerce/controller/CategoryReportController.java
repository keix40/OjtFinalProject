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

import com.Ojt.Ecommerce.service.CategoryReportService;

@RestController
@RequestMapping("/api/category-reports")
@CrossOrigin(origins = "http://localhost:4200")
public class CategoryReportController {

    @Autowired
    private CategoryReportService categoryReportService;

    @GetMapping("/pdf")
    public ResponseEntity<ByteArrayResource> exportCategoryReportToPDF() throws Exception {
        System.out.println("=== Category PDF Export Request Received ===");
        return exportCategoryReportToPDFWithIds(null);
    }

    @PostMapping("/pdf/selected")
    public ResponseEntity<ByteArrayResource> exportSelectedCategoriesToPDF(@RequestBody List<Long> categoryIds) throws Exception {
        System.out.println("=== Selected Category PDF Export Request Received ===");
        System.out.println("✓ Selected Category IDs: " + categoryIds);
        return exportCategoryReportToPDFWithIds(categoryIds);
    }

    private ResponseEntity<ByteArrayResource> exportCategoryReportToPDFWithIds(List<Long> selectedCategoryIds) throws Exception {
        System.out.println("=== Starting Category PDF Report Generation in Controller ===");
        byte[] reportBytes = categoryReportService.generatePdfReport(selectedCategoryIds);
        
        String fileName = "Britium_Gallery_Category_Report_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm")) + ".pdf";
        
        ByteArrayResource resource = new ByteArrayResource(reportBytes);
        
        System.out.println("✓ Category PDF report generated successfully. Size: " + reportBytes.length + " bytes");
        System.out.println("✓ File name: " + fileName);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(reportBytes.length)
            .body(resource);
    }

    @GetMapping("/csv")
    public ResponseEntity<ByteArrayResource> exportCategoryReportToCSV() throws Exception {
        System.out.println("=== Category CSV Export Request Received ===");
        return exportCategoryReportToCSVWithIds(null);
    }

    @PostMapping("/csv/selected")
    public ResponseEntity<ByteArrayResource> exportSelectedCategoriesToCSV(@RequestBody List<Long> categoryIds) throws Exception {
        System.out.println("=== Selected Category CSV Export Request Received ===");
        System.out.println("✓ Selected Category IDs: " + categoryIds);
        return exportCategoryReportToCSVWithIds(categoryIds);
    }

    private ResponseEntity<ByteArrayResource> exportCategoryReportToCSVWithIds(List<Long> selectedCategoryIds) throws Exception {
        System.out.println("=== Starting Category CSV Report Generation in Controller ===");
        byte[] reportBytes = categoryReportService.generateCsvReport(selectedCategoryIds);
        
        String fileName = "Britium_Gallery_Category_Report_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm")) + ".csv";
        
        ByteArrayResource resource = new ByteArrayResource(reportBytes);
        
        System.out.println("✓ Category CSV report generated successfully. Size: " + reportBytes.length + " bytes");
        System.out.println("✓ File name: " + fileName);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
            .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .contentLength(reportBytes.length)
            .body(resource);
    }
} 