package com.Ojt.Ecommerce.service;

import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.Ojt.Ecommerce.entity.ReturnRequest;
import com.Ojt.Ecommerce.exception.ReportGenerationException;
import com.Ojt.Ecommerce.repository.ReturnRequestRepository;

import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;

@Service
public class ReturnReportService {

    @Autowired
    private ReturnRequestRepository returnRequestRepository;

    public byte[] generatePdfReport(List<Long> selectedReturnIds) throws Exception {
        try {
            System.out.println("=== Starting Return PDF Report Generation ===");
            
            List<Map<String, Object>> reportData = prepareReportData(selectedReturnIds);
            System.out.println("✓ Prepared " + reportData.size() + " records for Return PDF report");
            
            if (reportData.isEmpty()) {
                System.out.println("⚠ Warning: No data to export");
            }
            
            // Load and compile the Jasper report template
            ClassPathResource resource = new ClassPathResource("reports/return_report_pdf.jrxml");
            if (!resource.exists()) {
                throw new ReportGenerationException("Return PDF report template not found: reports/return_report_pdf.jrxml");
            }
            
            InputStream reportTemplate = resource.getInputStream();
            System.out.println("✓ Loaded Return PDF report template");
            
            JasperReport jasperReport = JasperCompileManager.compileReport(reportTemplate);
            System.out.println("✓ Compiled Return PDF report template successfully");
            
            // Create data source
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(reportData);
            System.out.println("✓ Created data source with " + dataSource.getData().size() + " records");
            
            // Fill the report
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, new HashMap<>(), dataSource);
            System.out.println("✓ Filled Return PDF report successfully");
            
            // Export to PDF
            byte[] result = JasperExportManager.exportReportToPdf(jasperPrint);
            System.out.println("✓ Exported Return PDF report successfully");
            System.out.println("✓ Return PDF report size: " + result.length + " bytes");
            System.out.println("=== Return PDF Report Generation Completed Successfully ===");
            return result;
            
        } catch (Exception e) {
            System.err.println("❌ Error generating Return PDF report: " + e.getMessage());
            System.err.println("❌ Error type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            throw new ReportGenerationException("Failed to generate Return PDF report: " + e.getMessage(), e);
        }
    }

    public byte[] generateCsvReport(List<Long> selectedReturnIds) throws Exception {
        try {
            System.out.println("=== Starting Return CSV Report Generation ===");
            
            List<Map<String, Object>> reportData = prepareReportData(selectedReturnIds);
            System.out.println("✓ Prepared " + reportData.size() + " records for Return CSV report");
            
            if (reportData.isEmpty()) {
                System.out.println("⚠ Warning: No data to export");
                throw new ReportGenerationException("No data available for export");
            }
            
            // Create CSV content with proper encoding and formatting
            StringBuilder csvContent = new StringBuilder();
            
            // Add UTF-8 BOM for Excel compatibility
            csvContent.append("\uFEFF");
            
            // Add header row
            csvContent.append("Return ID,Order Code,Customer Name,Product Name,Reason,Status,Request Date,Total Amount,Refund Type,Admin Remark\n");
            
            // Add data rows with proper escaping
            for (Map<String, Object> row : reportData) {
                // Return ID
                csvContent.append("\"").append(escapeCsvField(row.get("returnId"))).append("\",");
                
                // Order Code
                csvContent.append("\"").append(escapeCsvField(row.get("orderCode"))).append("\",");
                
                // Customer Name
                csvContent.append("\"").append(escapeCsvField(row.get("customerName"))).append("\",");
                
                // Product Name
                csvContent.append("\"").append(escapeCsvField(row.get("productName"))).append("\",");
                
                // Reason
                csvContent.append("\"").append(escapeCsvField(row.get("reason"))).append("\",");
                
                // Status
                csvContent.append("\"").append(escapeCsvField(row.get("status"))).append("\",");
                
                // Request Date
                csvContent.append("\"").append(escapeCsvField(row.get("requestDate"))).append("\",");
                
                // Total Amount
                Object totalAmountObj = row.get("totalAmount");
                if (totalAmountObj != null) {
                    csvContent.append(totalAmountObj.toString());
                } else {
                    csvContent.append("0");
                }
                csvContent.append(",");
                
                // Refund Type
                csvContent.append("\"").append(escapeCsvField(row.get("refundType"))).append("\",");
                
                // Admin Remark
                csvContent.append("\"").append(escapeCsvField(row.get("adminRemark"))).append("\"");
                
                // End of row
                csvContent.append("\n");
            }
            
            // Convert to bytes using UTF-8 encoding
            byte[] result = csvContent.toString().getBytes("UTF-8");
            System.out.println("✓ Return CSV report size: " + result.length + " bytes");
            System.out.println("✓ Return CSV content preview: " + csvContent.substring(0, Math.min(200, csvContent.length())) + "...");
            System.out.println("=== Return CSV Report Generation Completed Successfully ===");
            
            return result;
            
        } catch (Exception e) {
            System.err.println("❌ Error generating Return CSV report: " + e.getMessage());
            System.err.println("❌ Error type: " + e.getClass().getSimpleName());
            System.err.println("❌ Stack trace:");
            e.printStackTrace();
            throw new ReportGenerationException("Failed to generate Return CSV report: " + e.getMessage(), e);
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

    private List<Map<String, Object>> prepareReportData(List<Long> selectedReturnIds) {
        List<Map<String, Object>> reportData = new ArrayList<>();
        
        // Get return requests
        List<ReturnRequest> returnRequests;
        if (selectedReturnIds != null && !selectedReturnIds.isEmpty()) {
            returnRequests = returnRequestRepository.findAllById(selectedReturnIds);
        } else {
            returnRequests = returnRequestRepository.findAll();
        }
        
        System.out.println("=== Preparing Return Report Data ===");
        System.out.println("✓ Found " + returnRequests.size() + " return requests to process");
        
        for (ReturnRequest returnRequest : returnRequests) {
            if (returnRequest == null) continue;
            
            try {
                Map<String, Object> returnRow = new HashMap<>();
                
                returnRow.put("returnId", returnRequest.getId());
                returnRow.put("orderCode", returnRequest.getOrder() != null ? returnRequest.getOrder().getOrderCode() : "N/A");
                returnRow.put("customerName", returnRequest.getUser() != null ? returnRequest.getUser().getName() : "N/A");
                
                // Get product name from return request products
                String productName = "N/A";
                if (returnRequest.getReturnRequestProducts() != null && !returnRequest.getReturnRequestProducts().isEmpty()) {
                    var returnProduct = returnRequest.getReturnRequestProducts().get(0);
                    if (returnProduct.getOrderProduct() != null && returnProduct.getOrderProduct().getProduct() != null) {
                        productName = returnProduct.getOrderProduct().getProduct().getProductName();
                    }
                }
                returnRow.put("productName", productName);
                
                returnRow.put("reason", returnRequest.getReasonForReturn() != null ? returnRequest.getReasonForReturn().toString() : "N/A");
                returnRow.put("status", returnRequest.getStatus() != null ? returnRequest.getStatus().toString() : "N/A");
                returnRow.put("requestDate", returnRequest.getRequestedAt() != null ? 
                    returnRequest.getRequestedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "N/A");
                
                // Calculate total amount from products
                double totalAmount = 0.0;
                if (returnRequest.getReturnRequestProducts() != null) {
                    for (var returnProduct : returnRequest.getReturnRequestProducts()) {
                        if (returnProduct.getOrderProduct() != null) {
                            double unitPrice = returnProduct.getOrderProduct().getUnitPrice() != null ? returnProduct.getOrderProduct().getUnitPrice() : 0.0;
                            int quantity = returnProduct.getQuantity() != null ? returnProduct.getQuantity() : 0;
                            totalAmount += unitPrice * quantity;
                        }
                    }
                }
                returnRow.put("totalAmount", totalAmount);
                
                returnRow.put("refundType", returnRequest.getRefund() != null ? returnRequest.getRefund().getRefundType().toString() : "N/A");
                returnRow.put("adminRemark", returnRequest.getAdminRemark() != null ? returnRequest.getAdminRemark() : "N/A");
                
                reportData.add(returnRow);
            } catch (Exception e) {
                System.err.println("❌ Error processing return request: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        return reportData;
    }
} 