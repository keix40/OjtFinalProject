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

import com.Ojt.Ecommerce.entity.UserOrder;
import com.Ojt.Ecommerce.exception.ReportGenerationException;
import com.Ojt.Ecommerce.repository.OrderRepository;

import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;

@Service
public class OrderReportService {

    @Autowired
    private OrderRepository orderRepository;

    public byte[] generatePdfReport(List<Long> selectedOrderIds) throws Exception {
        try {
            System.out.println("=== Starting Order PDF Report Generation ===");
            
            List<Map<String, Object>> reportData = prepareReportData(selectedOrderIds);
            System.out.println("✓ Prepared " + reportData.size() + " records for Order PDF report");
            
            if (reportData.isEmpty()) {
                System.out.println("⚠ Warning: No data to export");
            }
            
            // Load and compile the Jasper report template
            ClassPathResource resource = new ClassPathResource("reports/order_report_pdf.jrxml");
            if (!resource.exists()) {
                throw new ReportGenerationException("Order PDF report template not found: reports/order_report_pdf.jrxml");
            }
            
            InputStream reportTemplate = resource.getInputStream();
            System.out.println("✓ Loaded Order PDF report template");
            
            JasperReport jasperReport = JasperCompileManager.compileReport(reportTemplate);
            System.out.println("✓ Compiled Order PDF report template successfully");
            
            // Create data source
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(reportData);
            System.out.println("✓ Created data source with " + dataSource.getData().size() + " records");
            
            // Fill the report
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, new HashMap<>(), dataSource);
            System.out.println("✓ Filled Order PDF report successfully");
            
            // Export to PDF
            byte[] result = JasperExportManager.exportReportToPdf(jasperPrint);
            System.out.println("✓ Exported Order PDF report successfully");
            System.out.println("✓ Order PDF report size: " + result.length + " bytes");
            System.out.println("=== Order PDF Report Generation Completed Successfully ===");
            return result;
            
        } catch (Exception e) {
            System.err.println("❌ Error generating Order PDF report: " + e.getMessage());
            System.err.println("❌ Error type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            throw new ReportGenerationException("Failed to generate Order PDF report: " + e.getMessage(), e);
        }
    }

    public byte[] generateCsvReport(List<Long> selectedOrderIds) throws Exception {
        try {
            System.out.println("=== Starting Order CSV Report Generation ===");
            
            List<Map<String, Object>> reportData = prepareReportData(selectedOrderIds);
            System.out.println("✓ Prepared " + reportData.size() + " records for Order CSV report");
            
            if (reportData.isEmpty()) {
                System.out.println("⚠ Warning: No data to export");
                throw new ReportGenerationException("No data available for export");
            }
            
            // Create CSV content with proper encoding and formatting
            StringBuilder csvContent = new StringBuilder();
            
            // Add UTF-8 BOM for Excel compatibility
            csvContent.append("\uFEFF");
            
            // Add header row
            csvContent.append("Order Code,Order Date,Customer Name,Email,Phone,Status,Delivery Method,Delivery Fee,Subtotal,Discount Amount,Total,Total Items,Address,Discount Code\n");
            
            // Add data rows with proper escaping
            for (Map<String, Object> row : reportData) {
                // Order Code
                csvContent.append("\"").append(escapeCsvField(row.get("orderCode"))).append("\",");
                
                // Order Date
                csvContent.append("\"").append(escapeCsvField(row.get("orderDate"))).append("\",");
                
                // Customer Name
                csvContent.append("\"").append(escapeCsvField(row.get("customerName"))).append("\",");
                
                // Email
                csvContent.append("\"").append(escapeCsvField(row.get("email"))).append("\",");
                
                // Phone
                csvContent.append("\"").append(escapeCsvField(row.get("phone"))).append("\",");
                
                // Status
                csvContent.append("\"").append(escapeCsvField(row.get("status"))).append("\",");
                
                // Delivery Method
                csvContent.append("\"").append(escapeCsvField(row.get("deliveryMethod"))).append("\",");
                
                // Delivery Fee
                Object deliveryFeeObj = row.get("deliveryFee");
                if (deliveryFeeObj != null) {
                    csvContent.append(deliveryFeeObj.toString());
                } else {
                    csvContent.append("0");
                }
                csvContent.append(",");
                
                // Subtotal
                Object subtotalObj = row.get("subtotal");
                if (subtotalObj != null) {
                    csvContent.append(subtotalObj.toString());
                } else {
                    csvContent.append("0");
                }
                csvContent.append(",");
                
                // Discount Amount
                Object discountAmountObj = row.get("discountAmount");
                if (discountAmountObj != null) {
                    csvContent.append(discountAmountObj.toString());
                } else {
                    csvContent.append("0");
                }
                csvContent.append(",");
                
                // Total
                Object totalObj = row.get("total");
                if (totalObj != null) {
                    csvContent.append(totalObj.toString());
                } else {
                    csvContent.append("0");
                }
                csvContent.append(",");
                
                // Total Items
                Object totalItemsObj = row.get("totalItems");
                if (totalItemsObj != null) {
                    csvContent.append(totalItemsObj.toString());
                } else {
                    csvContent.append("0");
                }
                csvContent.append(",");
                
                // Address
                csvContent.append("\"").append(escapeCsvField(row.get("address"))).append("\",");
                
                // Discount Code
                csvContent.append("\"").append(escapeCsvField(row.get("discountCode"))).append("\"");
                
                // End of row
                csvContent.append("\n");
            }
            
            // Convert to bytes using UTF-8 encoding
            byte[] result = csvContent.toString().getBytes("UTF-8");
            System.out.println("✓ Order CSV report size: " + result.length + " bytes");
            System.out.println("✓ Order CSV content preview: " + csvContent.substring(0, Math.min(200, csvContent.length())) + "...");
            System.out.println("=== Order CSV Report Generation Completed Successfully ===");
            
            return result;
            
        } catch (Exception e) {
            System.err.println("❌ Error generating Order CSV report: " + e.getMessage());
            System.err.println("❌ Error type: " + e.getClass().getSimpleName());
            System.err.println("❌ Stack trace:");
            e.printStackTrace();
            throw new ReportGenerationException("Failed to generate Order CSV report: " + e.getMessage(), e);
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

    private List<Map<String, Object>> prepareReportData(List<Long> selectedOrderIds) {
        List<Map<String, Object>> reportData = new ArrayList<>();
        
        // Get orders
        List<UserOrder> orders;
        if (selectedOrderIds != null && !selectedOrderIds.isEmpty()) {
            orders = orderRepository.findAllById(selectedOrderIds);
        } else {
            orders = orderRepository.findAll();
        }
        
        System.out.println("=== Preparing Order Report Data ===");
        System.out.println("✓ Found " + orders.size() + " orders to process");
        
        for (UserOrder order : orders) {
            if (order == null) continue;
            
            try {
                Map<String, Object> orderRow = new HashMap<>();
                
                orderRow.put("orderCode", order.getOrderCode() != null ? order.getOrderCode() : "N/A");
                orderRow.put("orderDate", order.getOrderDate() != null ? 
                    order.getOrderDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "N/A");
                orderRow.put("customerName", order.getUser() != null ? order.getUser().getName() : "N/A");
                orderRow.put("email", order.getUser() != null ? order.getUser().getEmail() : "N/A");
                orderRow.put("phone", order.getUser() != null ? order.getUser().getPhoneNumber() : "N/A");
                orderRow.put("status", "Active"); // Default status since it's not in UserOrder entity
                orderRow.put("deliveryMethod", order.getDeliveryMethod() != null ? order.getDeliveryMethod().getName() : "N/A");
                orderRow.put("deliveryFee", order.getDeliveryFee() != null ? order.getDeliveryFee() : 0.0);
                orderRow.put("subtotal", 0.0); // Calculate from order products if needed
                orderRow.put("discountAmount", 0.0); // Calculate from discount if needed
                orderRow.put("total", 0.0); // Calculate total if needed
                
                // Calculate total items
                int totalItems = 0;
                if (order.getOrderProducts() != null) {
                    for (var orderProduct : order.getOrderProducts()) {
                        totalItems += orderProduct.getQuantity() != null ? orderProduct.getQuantity() : 0;
                    }
                }
                orderRow.put("totalItems", totalItems);
                
                // Format address
                String address = "N/A";
                if (order.getAddress() != null) {
                    address = order.getAddress().getAddress() + ", " + 
                             order.getAddress().getCity() + ", " + 
                             order.getAddress().getState() + " " + 
                             order.getAddress().getPostalCode();
                }
                orderRow.put("address", address);
                
                orderRow.put("discountCode", "N/A"); // Not available in UserOrder entity
                
                reportData.add(orderRow);
            } catch (Exception e) {
                System.err.println("❌ Error processing order: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        return reportData;
    }
} 