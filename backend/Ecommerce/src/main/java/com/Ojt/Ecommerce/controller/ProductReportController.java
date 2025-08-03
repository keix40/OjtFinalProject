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

import com.Ojt.Ecommerce.service.JasperReportService;


@RestController
@RequestMapping("/api/product-reports")
@CrossOrigin(origins = "http://localhost:4200")
public class ProductReportController {

    @Autowired
    private JasperReportService jasperReportService;



    @GetMapping("/excel")
    public ResponseEntity<ByteArrayResource> exportProductReportToExcel() throws Exception {
        System.out.println("=== Excel Export Request Received ===");
            return exportProductReportToExcelWithIds(null);
    }

    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Backend is working!");
    }

    @GetMapping("/test-excel")
    public ResponseEntity<ByteArrayResource> testExcelExport() throws Exception {
        System.out.println("=== Test Excel Export Request Received ===");
        byte[] reportBytes = jasperReportService.generateTestExcelReport();
        
        String fileName = "test_excel.xlsx";
        
        ByteArrayResource resource = new ByteArrayResource(reportBytes);
        
        System.out.println("✓ Test Excel report generated successfully. Size: " + reportBytes.length + " bytes");
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .contentLength(reportBytes.length)
            .body(resource);
    }

    @PostMapping("/excel/selected")
    public ResponseEntity<ByteArrayResource> exportSelectedProductsToExcel(@RequestBody List<Long> productIds) throws Exception {
        System.out.println("=== Selected Excel Export Request Received ===");
        System.out.println("✓ Selected Product IDs: " + productIds);
        return exportProductReportToExcelWithIds(productIds);
    }

    private ResponseEntity<ByteArrayResource> exportProductReportToExcelWithIds(List<Long> selectedProductIds) throws Exception {
        System.out.println("=== Starting Excel Report Generation in Controller ===");
        byte[] reportBytes = jasperReportService.generateExcelReport(selectedProductIds);
            
            String fileName = "Britium_Gallery_Product_Report_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm")) + ".xlsx";
            
            ByteArrayResource resource = new ByteArrayResource(reportBytes);
        
        System.out.println("✓ Excel report generated successfully. Size: " + reportBytes.length + " bytes");
        System.out.println("✓ File name: " + fileName);
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(reportBytes.length)
                .body(resource);
    }

    @GetMapping("/pdf")
    public ResponseEntity<ByteArrayResource> exportProductReportToPDF() throws Exception {
        System.out.println("=== PDF Export Request Received ===");
        return exportProductReportToPDFWithIds(null);
    }

    @PostMapping("/pdf/selected")
    public ResponseEntity<ByteArrayResource> exportSelectedProductsToPDF(@RequestBody List<Long> productIds) throws Exception {
        System.out.println("=== Selected PDF Export Request Received ===");
        System.out.println("✓ Selected Product IDs: " + productIds);
        return exportProductReportToPDFWithIds(productIds);
    }

    private ResponseEntity<ByteArrayResource> exportProductReportToPDFWithIds(List<Long> selectedProductIds) throws Exception {
        System.out.println("=== Starting PDF Report Generation in Controller ===");
        byte[] reportBytes = jasperReportService.generatePdfReport(selectedProductIds);
        
        String fileName = "Britium_Gallery_Product_Report_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm")) + ".pdf";
        
        ByteArrayResource resource = new ByteArrayResource(reportBytes);
        
        System.out.println("✓ PDF report generated successfully. Size: " + reportBytes.length + " bytes");
        System.out.println("✓ File name: " + fileName);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(reportBytes.length)
            .body(resource);
    }

    @GetMapping("/csv")
    public ResponseEntity<ByteArrayResource> exportProductReportToCSV() throws Exception {
        System.out.println("=== CSV Export Request Received ===");
        return exportProductReportToCSVWithIds(null);
    }

    @PostMapping("/csv/selected")
    public ResponseEntity<ByteArrayResource> exportSelectedProductsToCSV(@RequestBody List<Long> productIds) throws Exception {
        System.out.println("=== Selected CSV Export Request Received ===");
        System.out.println("✓ Selected Product IDs: " + productIds);
        return exportProductReportToCSVWithIds(productIds);
    }

    private ResponseEntity<ByteArrayResource> exportProductReportToCSVWithIds(List<Long> selectedProductIds) throws Exception {
        System.out.println("=== Starting CSV Report Generation in Controller ===");
        byte[] reportBytes = jasperReportService.generateCsvReport(selectedProductIds);
        
        String fileName = "Britium_Gallery_Product_Report_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm")) + ".csv";
        
        ByteArrayResource resource = new ByteArrayResource(reportBytes);
        
        System.out.println("✓ CSV report generated successfully. Size: " + reportBytes.length + " bytes");
        System.out.println("✓ File name: " + fileName);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
            .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .contentLength(reportBytes.length)
            .body(resource);
    }


} 