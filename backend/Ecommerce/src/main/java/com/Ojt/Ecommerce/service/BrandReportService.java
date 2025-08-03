package com.Ojt.Ecommerce.service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.Ojt.Ecommerce.entity.Brand;
import com.Ojt.Ecommerce.exception.ReportGenerationException;
import com.Ojt.Ecommerce.repository.BrandRepository;

import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;

@Service
public class BrandReportService {

    @Autowired
    private BrandRepository brandRepository;

    public byte[] generatePdfReport(List<Long> selectedBrandIds) throws Exception {
        try {
            System.out.println("=== Starting Brand PDF Report Generation ===");
            
            List<Map<String, Object>> reportData = prepareReportData(selectedBrandIds);
            System.out.println("✓ Prepared " + reportData.size() + " records for Brand PDF report");
            
            if (reportData.isEmpty()) {
                System.out.println("⚠ Warning: No data to export");
            }
            
            // Load and compile the Jasper report template
            ClassPathResource resource = new ClassPathResource("reports/brand_report_pdf.jrxml");
            if (!resource.exists()) {
                throw new ReportGenerationException("Brand PDF report template not found: reports/brand_report_pdf.jrxml");
            }
            
            InputStream reportTemplate = resource.getInputStream();
            System.out.println("✓ Loaded Brand PDF report template");
            
            JasperReport jasperReport = JasperCompileManager.compileReport(reportTemplate);
            System.out.println("✓ Compiled Brand PDF report template successfully");
            
            // Create data source
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(reportData);
            System.out.println("✓ Created data source with " + dataSource.getData().size() + " records");
            
            // Fill the report
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, new HashMap<>(), dataSource);
            System.out.println("✓ Filled Brand PDF report successfully");
            
            // Export to PDF
            byte[] result = JasperExportManager.exportReportToPdf(jasperPrint);
            System.out.println("✓ Exported Brand PDF report successfully");
            System.out.println("✓ Brand PDF report size: " + result.length + " bytes");
            System.out.println("=== Brand PDF Report Generation Completed Successfully ===");
            return result;
            
        } catch (Exception e) {
            System.err.println("❌ Error generating Brand PDF report: " + e.getMessage());
            System.err.println("❌ Error type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            throw new ReportGenerationException("Failed to generate Brand PDF report: " + e.getMessage(), e);
        }
    }

    public byte[] generateCsvReport(List<Long> selectedBrandIds) throws Exception {
        try {
            System.out.println("=== Starting Brand CSV Report Generation ===");
            
            List<Map<String, Object>> reportData = prepareReportData(selectedBrandIds);
            System.out.println("✓ Prepared " + reportData.size() + " records for Brand CSV report");
            
            if (reportData.isEmpty()) {
                System.out.println("⚠ Warning: No data to export");
                throw new ReportGenerationException("No data available for export");
            }
            
            // Create CSV content with proper encoding and formatting
            StringBuilder csvContent = new StringBuilder();
            
            // Add UTF-8 BOM for Excel compatibility
            csvContent.append("\uFEFF");
            
            // Add header row
            csvContent.append("Brand Name,Image URL,Status\n");
            
            // Add data rows with proper escaping
            for (Map<String, Object> row : reportData) {
                // Brand Name
                csvContent.append("\"").append(escapeCsvField(row.get("brandName"))).append("\",");
                
                // Image URL - show full URL for CSV
                String imageUrl = (String) row.get("imageUrl");
                if (imageUrl != null && !imageUrl.equals("N/A")) {
                    // Already contains full URL, no need to modify
                }
                csvContent.append("\"").append(escapeCsvField(imageUrl)).append("\",");
                
                // Status
                csvContent.append("\"").append(escapeCsvField(row.get("status"))).append("\"");
                
                // End of row
                csvContent.append("\n");
            }
            
            // Convert to bytes using UTF-8 encoding
            byte[] result = csvContent.toString().getBytes("UTF-8");
            System.out.println("✓ Brand CSV report size: " + result.length + " bytes");
            System.out.println("✓ Brand CSV content preview: " + csvContent.substring(0, Math.min(200, csvContent.length())) + "...");
            System.out.println("=== Brand CSV Report Generation Completed Successfully ===");
            
            return result;
            
        } catch (Exception e) {
            System.err.println("❌ Error generating Brand CSV report: " + e.getMessage());
            System.err.println("❌ Error type: " + e.getClass().getSimpleName());
            System.err.println("❌ Stack trace:");
            e.printStackTrace();
            throw new ReportGenerationException("Failed to generate Brand CSV report: " + e.getMessage(), e);
        }
    }
    
    private String escapeCsvField(Object value) {
        if (value == null) return "";
        String str = value.toString();
        
        // Remove any newlines or carriage returns that could break CSV format
        str = str.replace("\n", " ").replace("\r", " ");
        
        // Escape double quotes by doubling them
        str = str.replace("\"", "\"\"");
        
        return str;
    }

    private List<Map<String, Object>> prepareReportData(List<Long> selectedBrandIds) {
        List<Map<String, Object>> reportData = new ArrayList<>();
        
        // Get brands
        List<Brand> brands;
        if (selectedBrandIds != null && !selectedBrandIds.isEmpty()) {
            brands = brandRepository.findAllById(selectedBrandIds);
        } else {
            brands = brandRepository.findAll();
        }
        
        System.out.println("=== Preparing Brand Report Data ===");
        System.out.println("✓ Found " + brands.size() + " brands to process");
        
        for (Brand brand : brands) {
            if (brand == null) continue;
            
            try {
                Map<String, Object> brandRow = new HashMap<>();
                
                // Remove ID column - only include name, image, and status
                brandRow.put("brandName", brand.getName() != null ? brand.getName() : "N/A");
                
                // Handle image - include actual image data if available
                String imageData = "N/A";
                if (brand.getImage() != null && !brand.getImage().trim().isEmpty()) {
                    try {
                        String imagePath = brand.getImage();
                        if (!imagePath.startsWith("http://") && !imagePath.startsWith("https://")) {
                            if (!imagePath.startsWith("/")) {
                                imagePath = "/" + imagePath;
                            }
                            // Show full URL for better visibility
                            imageData = "http://localhost:8080" + imagePath;
                        } else {
                            imageData = imagePath;
                        }
                    } catch (Exception e) {
                        System.err.println("❌ Error processing image for brand " + brand.getName() + ": " + e.getMessage());
                        imageData = "N/A";
                    }
                }
                brandRow.put("imageUrl", imageData);
                
                brandRow.put("status", brand.getStatus() != null && brand.getStatus() == 1 ? "Active" : "Inactive");
                
                reportData.add(brandRow);
            } catch (Exception e) {
                System.err.println("❌ Error processing brand: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        return reportData;
    }
} 