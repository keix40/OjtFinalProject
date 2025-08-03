package com.Ojt.Ecommerce.service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.Ojt.Ecommerce.entity.Category;
import com.Ojt.Ecommerce.exception.ReportGenerationException;
import com.Ojt.Ecommerce.repository.CategoryRepository;

import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;

@Service
public class CategoryReportService {

    @Autowired
    private CategoryRepository categoryRepository;

    public byte[] generatePdfReport(List<Long> selectedCategoryIds) throws Exception {
        try {
            System.out.println("=== Starting Category PDF Report Generation ===");
            
            List<Map<String, Object>> reportData = prepareReportData(selectedCategoryIds);
            System.out.println("✓ Prepared " + reportData.size() + " records for Category PDF report");
            
            if (reportData.isEmpty()) {
                System.out.println("⚠ Warning: No data to export");
            }
            
            // Load and compile the Jasper report template
            ClassPathResource resource = new ClassPathResource("reports/category_report_pdf.jrxml");
            if (!resource.exists()) {
                throw new ReportGenerationException("Category PDF report template not found: reports/category_report_pdf.jrxml");
            }
            
            InputStream reportTemplate = resource.getInputStream();
            System.out.println("✓ Loaded Category PDF report template");
            
            JasperReport jasperReport = JasperCompileManager.compileReport(reportTemplate);
            System.out.println("✓ Compiled Category PDF report template successfully");
            
            // Create data source
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(reportData);
            System.out.println("✓ Created data source with " + dataSource.getData().size() + " records");
            
            // Fill the report
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, new HashMap<>(), dataSource);
            System.out.println("✓ Filled Category PDF report successfully");
            
            // Export to PDF
            byte[] result = JasperExportManager.exportReportToPdf(jasperPrint);
            System.out.println("✓ Exported Category PDF report successfully");
            System.out.println("✓ Category PDF report size: " + result.length + " bytes");
            System.out.println("=== Category PDF Report Generation Completed Successfully ===");
            return result;
            
        } catch (Exception e) {
            System.err.println("❌ Error generating Category PDF report: " + e.getMessage());
            System.err.println("❌ Error type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            throw new ReportGenerationException("Failed to generate Category PDF report: " + e.getMessage(), e);
        }
    }

    public byte[] generateCsvReport(List<Long> selectedCategoryIds) throws Exception {
        try {
            System.out.println("=== Starting Category CSV Report Generation ===");
            
            List<Map<String, Object>> reportData = prepareReportData(selectedCategoryIds);
            System.out.println("✓ Prepared " + reportData.size() + " records for Category CSV report");
            
            if (reportData.isEmpty()) {
                System.out.println("⚠ Warning: No data to export");
                throw new ReportGenerationException("No data available for export");
            }
            
            // Create CSV content with proper encoding and formatting
            StringBuilder csvContent = new StringBuilder();
            
            // Add UTF-8 BOM for Excel compatibility
            csvContent.append("\uFEFF");
            
            // Add header row
            csvContent.append("Category Name,Parent Category,Image URL,Level,Status\n");
            
            // Add data rows with proper escaping
            for (Map<String, Object> row : reportData) {
                // Category Name
                csvContent.append("\"").append(escapeCsvField(row.get("categoryName"))).append("\",");
                
                // Parent Category
                csvContent.append("\"").append(escapeCsvField(row.get("parentCategory"))).append("\",");
                
                // Image URL - show full URL for CSV
                String imageUrl = (String) row.get("imageUrl");
                if (imageUrl != null && !imageUrl.equals("N/A")) {
                    // Already contains full URL, no need to modify
                }
                csvContent.append("\"").append(escapeCsvField(imageUrl)).append("\",");
                
                // Level
                Object levelObj = row.get("level");
                if (levelObj != null) {
                    csvContent.append(levelObj.toString());
                } else {
                    csvContent.append("0");
                }
                csvContent.append(",");
                
                // Status
                csvContent.append("\"").append(escapeCsvField(row.get("status"))).append("\"");
                
                // End of row
                csvContent.append("\n");
            }
            
            // Convert to bytes using UTF-8 encoding
            byte[] result = csvContent.toString().getBytes("UTF-8");
            System.out.println("✓ Category CSV report size: " + result.length + " bytes");
            System.out.println("✓ Category CSV content preview: " + csvContent.substring(0, Math.min(200, csvContent.length())) + "...");
            System.out.println("=== Category CSV Report Generation Completed Successfully ===");
            
            return result;
            
        } catch (Exception e) {
            System.err.println("❌ Error generating Category CSV report: " + e.getMessage());
            System.err.println("❌ Error type: " + e.getClass().getSimpleName());
            System.err.println("❌ Stack trace:");
            e.printStackTrace();
            throw new ReportGenerationException("Failed to generate Category CSV report: " + e.getMessage(), e);
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

    private List<Map<String, Object>> prepareReportData(List<Long> selectedCategoryIds) {
        List<Map<String, Object>> reportData = new ArrayList<>();
        
        // Get categories
        List<Category> categories;
        if (selectedCategoryIds != null && !selectedCategoryIds.isEmpty()) {
            categories = categoryRepository.findAllById(selectedCategoryIds);
        } else {
            categories = categoryRepository.findAll();
        }
        
        System.out.println("=== Preparing Category Report Data ===");
        System.out.println("✓ Found " + categories.size() + " categories to process");
        
        for (Category category : categories) {
            if (category == null) continue;
            
            try {
                Map<String, Object> categoryRow = new HashMap<>();
                
                // Remove ID column - only include name, parent, image, level, and status
                categoryRow.put("categoryName", category.getName() != null ? category.getName() : "N/A");
                categoryRow.put("parentCategory", category.getParent() != null ? category.getParent().getName() : "Root");
                categoryRow.put("level", calculateCategoryLevel(category));
                
                // Handle image - include actual image data if available
                String imageData = "N/A";
                if (category.getImage() != null && !category.getImage().trim().isEmpty()) {
                    try {
                        String imagePath = category.getImage();
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
                        System.err.println("❌ Error processing image for category " + category.getName() + ": " + e.getMessage());
                        imageData = "N/A";
                    }
                }
                categoryRow.put("imageUrl", imageData);
                
                categoryRow.put("status", category.getStatus() != null && category.getStatus() == 1 ? "Active" : "Inactive");
                
                reportData.add(categoryRow);
            } catch (Exception e) {
                System.err.println("❌ Error processing category: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        return reportData;
    }
    
    private int calculateCategoryLevel(Category category) {
        int level = 0;
        Category current = category;
        while (current.getParent() != null) {
            level++;
            current = current.getParent();
        }
        return level;
    }
} 