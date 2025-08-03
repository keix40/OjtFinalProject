package com.Ojt.Ecommerce.service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.entity.ProductVariant;
import com.Ojt.Ecommerce.entity.VariantAttributeValue;
import com.Ojt.Ecommerce.exception.ReportGenerationException;
import com.Ojt.Ecommerce.repository.ProductRepository;
import com.Ojt.Ecommerce.repository.ProductVariantRepository;
import com.Ojt.Ecommerce.repository.VariantAttributeValueRepository;

import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;

@Service
public class JasperReportService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private VariantAttributeValueRepository variantAttributeValueRepository;

    public byte[] generateExcelReport(List<Long> selectedProductIds) throws Exception {
        try {
            System.out.println("=== Starting Excel Report Generation ===");
            System.out.println("✓ Selected Product IDs: " + (selectedProductIds != null ? selectedProductIds.size() : "All products"));
            
            List<Map<String, Object>> reportData = prepareReportData(selectedProductIds);
            System.out.println("✓ Prepared " + reportData.size() + " records for Excel report");
            
            if (reportData.isEmpty()) {
                System.out.println("⚠ Warning: No data to export");
                throw new ReportGenerationException("No data available for export");
            }
            
            // Create Excel workbook using Apache POI
            try (Workbook workbook = new XSSFWorkbook()) {
                Sheet sheet = workbook.createSheet("Product Report");
                
                // Create styles
                CellStyle titleStyle = workbook.createCellStyle();
                Font titleFont = workbook.createFont();
                titleFont.setBold(true);
                titleFont.setFontHeightInPoints((short) 16);
                titleStyle.setFont(titleFont);
                titleStyle.setAlignment(HorizontalAlignment.CENTER);
                
                CellStyle headerStyle = workbook.createCellStyle();
                Font headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setFontHeightInPoints((short) 10);
                headerStyle.setFont(headerFont);
                headerStyle.setAlignment(HorizontalAlignment.CENTER);
                headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                
                CellStyle dataStyle = workbook.createCellStyle();
                Font dataFont = workbook.createFont();
                dataFont.setFontHeightInPoints((short) 9);
                dataStyle.setFont(dataFont);
                
                CellStyle priceStyle = workbook.createCellStyle();
                priceStyle.setFont(dataFont);
                priceStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));
                priceStyle.setAlignment(HorizontalAlignment.RIGHT);
                
                int rowNum = 0;
                
                // Add title
                Row titleRow = sheet.createRow(rowNum++);
                Cell titleCell = titleRow.createCell(0);
                titleCell.setCellValue("BRITIUM GALLERY");
                titleCell.setCellStyle(titleStyle);
                sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));
                
                // Add subtitle
                Row subtitleRow = sheet.createRow(rowNum++);
                Cell subtitleCell = subtitleRow.createCell(0);
                subtitleCell.setCellValue("Product Inventory Report");
                subtitleCell.setCellStyle(headerStyle);
                sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 7));
                
                // Add empty row
                rowNum++;
                
                // Add headers
                Row headerRow = sheet.createRow(rowNum++);
                String[] headers = {"Product Code", "Product Name", "Description", "Quantity", "Price (MMK)", "Create Date", "Status", "Variant Details"};
                
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                }
                
                // Add data rows
                for (Map<String, Object> row : reportData) {
                    Row dataRow = sheet.createRow(rowNum++);
                    
                    // Product Code
                    Cell cell0 = dataRow.createCell(0);
                    String productCode = row.get("productCode") != null ? row.get("productCode").toString() : "";
                    cell0.setCellValue(productCode);
                    cell0.setCellStyle(dataStyle);
                    
                    // Product Name
                    Cell cell1 = dataRow.createCell(1);
                    String productName = row.get("productName") != null ? row.get("productName").toString() : "";
                    cell1.setCellValue(productName);
                    cell1.setCellStyle(dataStyle);
                    
                    // Description
                    Cell cell2 = dataRow.createCell(2);
                    String description = row.get("description") != null ? row.get("description").toString() : "";
                    cell2.setCellValue(description);
                    cell2.setCellStyle(dataStyle);
                    
                    // Quantity
                    Cell cell3 = dataRow.createCell(3);
                    Object quantityObj = row.get("quantity");
                    if (quantityObj != null) {
                        if (quantityObj instanceof Number) {
                            cell3.setCellValue(((Number) quantityObj).doubleValue());
                        } else {
                            cell3.setCellValue(quantityObj.toString());
                        }
                    } else {
                        cell3.setCellValue(0);
                    }
                    cell3.setCellStyle(dataStyle);
                    
                    // Price
                    Cell cell4 = dataRow.createCell(4);
                    Object priceObj = row.get("price");
                    if (priceObj != null) {
                        if (priceObj instanceof Number) {
                            cell4.setCellValue(((Number) priceObj).doubleValue());
                        } else {
                            cell4.setCellValue(priceObj.toString());
                        }
                    } else {
                        cell4.setCellValue(0.0);
                    }
                    cell4.setCellStyle(priceStyle);
                    
                    // Create Date
                    Cell cell5 = dataRow.createCell(5);
                    String createDate = row.get("createDate") != null ? row.get("createDate").toString() : "";
                    cell5.setCellValue(createDate);
                    cell5.setCellStyle(dataStyle);
                    
                    // Status
                    Cell cell6 = dataRow.createCell(6);
                    String status = row.get("status") != null ? row.get("status").toString() : "";
                    cell6.setCellValue(status);
                    cell6.setCellStyle(dataStyle);
                    
                    // Variant Details
                    Cell cell7 = dataRow.createCell(7);
                    String variantDetails = row.get("variantDetails") != null ? row.get("variantDetails").toString() : "";
                    cell7.setCellValue(variantDetails);
                    cell7.setCellStyle(dataStyle);
                }
                
                // Set column widths manually instead of auto-sizing
                sheet.setColumnWidth(0, 15 * 256); // Product Code
                sheet.setColumnWidth(1, 25 * 256); // Product Name
                sheet.setColumnWidth(2, 30 * 256); // Description
                sheet.setColumnWidth(3, 10 * 256); // Quantity
                sheet.setColumnWidth(4, 15 * 256); // Price
                sheet.setColumnWidth(5, 15 * 256); // Create Date
                sheet.setColumnWidth(6, 10 * 256); // Status
                sheet.setColumnWidth(7, 20 * 256); // Variant Details
                
                // Write to byte array
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                workbook.write(outputStream);
                outputStream.flush();
                
                byte[] result = outputStream.toByteArray();
                System.out.println("✓ Excel report size: " + result.length + " bytes");
                
                if (result.length == 0) {
                    throw new ReportGenerationException("Generated Excel file is empty");
                }
                
                System.out.println("=== Excel Report Generation Completed Successfully ===");
                return result;
            }
            
        } catch (Exception e) {
            System.err.println("❌ Error generating Excel report: " + e.getMessage());
            System.err.println("❌ Error type: " + e.getClass().getSimpleName());
            System.err.println("❌ Stack trace:");
            e.printStackTrace();
            throw new ReportGenerationException("Failed to generate Excel report: " + e.getMessage(), e);
        }
    }

    // Test method to create a simple Excel file
    public byte[] generateTestExcelReport() throws Exception {
        try {
            System.out.println("=== Creating Test Excel Report ===");
            
            // Create Excel workbook using Apache POI
            try (Workbook workbook = new XSSFWorkbook()) {
                Sheet sheet = workbook.createSheet("Test Sheet");
                
                // Create a simple header
                Row headerRow = sheet.createRow(0);
                Cell headerCell = headerRow.createCell(0);
                headerCell.setCellValue("Test Header");
                
                // Create a simple data row
                Row dataRow = sheet.createRow(1);
                Cell dataCell = dataRow.createCell(0);
                dataCell.setCellValue("Test Data");
                
                // Write to byte array
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                workbook.write(outputStream);
                outputStream.flush();
                
                byte[] result = outputStream.toByteArray();
                System.out.println("✓ Test Excel report size: " + result.length + " bytes");
                
                return result;
            }
            
        } catch (Exception e) {
            System.err.println("❌ Error generating test Excel report: " + e.getMessage());
            e.printStackTrace();
            throw new ReportGenerationException("Failed to generate test Excel report: " + e.getMessage(), e);
        }
    }

    public byte[] generatePdfReport(List<Long> selectedProductIds) throws Exception {
        try {
            System.out.println("=== Starting PDF Report Generation ===");
            
            List<Map<String, Object>> reportData = prepareReportData(selectedProductIds);
            System.out.println("✓ Prepared " + reportData.size() + " records for PDF report");
            
            if (reportData.isEmpty()) {
                System.out.println("⚠ Warning: No data to export");
            }
            
            // Load and compile the Jasper report template
            ClassPathResource resource = new ClassPathResource("reports/product_report_pdf.jrxml");
            if (!resource.exists()) {
                throw new ReportGenerationException("PDF report template not found: reports/product_report_pdf.jrxml");
            }
            
            InputStream reportTemplate = resource.getInputStream();
            System.out.println("✓ Loaded PDF report template");
            
            JasperReport jasperReport = JasperCompileManager.compileReport(reportTemplate);
            System.out.println("✓ Compiled PDF report template successfully");
            
            // Create data source
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(reportData);
            System.out.println("✓ Created data source with " + dataSource.getData().size() + " records");
            
            // Fill the report
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, new HashMap<>(), dataSource);
            System.out.println("✓ Filled PDF report successfully");
            
            // Export to PDF
            byte[] result = JasperExportManager.exportReportToPdf(jasperPrint);
            System.out.println("✓ Exported PDF report successfully");
            System.out.println("✓ PDF report size: " + result.length + " bytes");
            System.out.println("=== PDF Report Generation Completed Successfully ===");
            return result;
            
        } catch (Exception e) {
            System.err.println("❌ Error generating PDF report: " + e.getMessage());
            System.err.println("❌ Error type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            throw new ReportGenerationException("Failed to generate PDF report: " + e.getMessage(), e);
        }
    }

    public byte[] generateCsvReport(List<Long> selectedProductIds) throws Exception {
        try {
            System.out.println("=== Starting CSV Report Generation ===");
            
            List<Map<String, Object>> reportData = prepareReportData(selectedProductIds);
            System.out.println("✓ Prepared " + reportData.size() + " records for CSV report");
            
            if (reportData.isEmpty()) {
                System.out.println("⚠ Warning: No data to export");
                throw new ReportGenerationException("No data available for export");
            }
            
            // Create CSV content with proper encoding and formatting
            StringBuilder csvContent = new StringBuilder();
            
            // Add UTF-8 BOM for Excel compatibility
            csvContent.append("\uFEFF");
            
            // Add header row
            csvContent.append("Product Code,Product Name,Description,Quantity,Price (MMK),Create Date,Status,Variant Details\n");
            
            // Add data rows with proper escaping
            for (Map<String, Object> row : reportData) {
                // Product Code
                csvContent.append("\"").append(escapeCsvField(row.get("productCode"))).append("\",");
                
                // Product Name
                csvContent.append("\"").append(escapeCsvField(row.get("productName"))).append("\",");
                
                // Description
                csvContent.append("\"").append(escapeCsvField(row.get("description"))).append("\",");
                
                // Quantity
                Object quantityObj = row.get("quantity");
                if (quantityObj != null) {
                    csvContent.append(quantityObj.toString());
                } else {
                    csvContent.append("0");
                }
                csvContent.append(",");
                
                // Price
                Object priceObj = row.get("price");
                if (priceObj != null) {
                    csvContent.append(priceObj.toString());
                } else {
                    csvContent.append("0.0");
                }
                csvContent.append(",");
                
                // Create Date
                csvContent.append("\"").append(escapeCsvField(row.get("createDate"))).append("\",");
                
                // Status
                csvContent.append("\"").append(escapeCsvField(row.get("status"))).append("\",");
                
                // Variant Details
                csvContent.append("\"").append(escapeCsvField(row.get("variantDetails"))).append("\"");
                
                // End of row
                csvContent.append("\n");
            }
            
            // Convert to bytes using UTF-8 encoding
            byte[] result = csvContent.toString().getBytes("UTF-8");
            System.out.println("✓ CSV report size: " + result.length + " bytes");
            System.out.println("✓ CSV content preview: " + csvContent.substring(0, Math.min(200, csvContent.length())) + "...");
            System.out.println("=== CSV Report Generation Completed Successfully ===");
            
            return result;
            
        } catch (Exception e) {
            System.err.println("❌ Error generating CSV report: " + e.getMessage());
            System.err.println("❌ Error type: " + e.getClass().getSimpleName());
            System.err.println("❌ Stack trace:");
            e.printStackTrace();
            throw new ReportGenerationException("Failed to generate CSV report: " + e.getMessage(), e);
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

    private List<Map<String, Object>> prepareReportData(List<Long> selectedProductIds) {
        List<Map<String, Object>> reportData = new ArrayList<>();
        
        // Get products
        List<Product> products;
        if (selectedProductIds != null && !selectedProductIds.isEmpty()) {
            products = productRepository.findAllById(selectedProductIds);
        } else {
            products = productRepository.findAllProduct();
        }
        
        System.out.println("=== Preparing Report Data ===");
        System.out.println("✓ Found " + products.size() + " products to process");
        
        for (Product product : products) {
            if (product == null) continue;
            
            try {
                // Add main product data
                Map<String, Object> productRow = new HashMap<>();
                productRow.put("productCode", product.getProductCode() != null ? product.getProductCode() : "N/A");
                productRow.put("productName", product.getProductName() != null ? product.getProductName() : "N/A");
                productRow.put("description", product.getDescription() != null ? product.getDescription() : "N/A");
                
                Long productQuantity = product.getQuantity() != null ? product.getQuantity() : 0L;
                productRow.put("quantity", productQuantity);
                String productName = product.getProductName() != null ? product.getProductName() : "Unknown Product";
                System.out.println("✓ Product '" + productName + "' quantity: " + productQuantity + " (type: " + productQuantity.getClass().getSimpleName() + ")");
                
                productRow.put("price", product.getPrice() != null ? product.getPrice() : 0.0);
                productRow.put("createDate", product.getCreateDate() != null ? 
                    product.getCreateDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "N/A");
                productRow.put("status", product.getStatus() != null && product.getStatus() == 1 ? "Active" : "Inactive");
                productRow.put("isVariant", false);
                productRow.put("variantDetails", "No");
                productRow.put("variantSku", "");
                productRow.put("variantStock", 0);
                productRow.put("variantPrice", 0.0);
                productRow.put("variantAttributes", "");
                
                reportData.add(productRow);
                
                // Add variant data if exists
                List<ProductVariant> variants = productVariantRepository.findByProduct(product);
                if (variants != null && !variants.isEmpty()) {
                    // Update main product to show it has variants
                    productRow.put("variantDetails", "Yes");
                    
                    for (ProductVariant variant : variants) {
                        if (variant == null) continue;
                        
                        try {
                            Map<String, Object> variantRow = new HashMap<>();
                            String stockKeeping = variant.getStockKeeping() != null ? variant.getStockKeeping() : "N/A";
                            variantRow.put("productCode", "  └─ " + stockKeeping);
                            variantRow.put("productName", "  └─ " + productName);
                            variantRow.put("description", "  └─ " + (product.getDescription() != null ? product.getDescription() : "N/A"));
                            
                            Long variantQuantity = variant.getStock() != null ? variant.getStock().longValue() : 0L;
                            variantRow.put("quantity", variantQuantity);
                            System.out.println("✓ Variant '" + stockKeeping + "' quantity: " + variantQuantity + " (type: " + variantQuantity.getClass().getSimpleName() + ")");
                            
                            variantRow.put("price", variant.getPrice() != null ? variant.getPrice().doubleValue() : 0.0);
                            variantRow.put("createDate", product.getCreateDate() != null ? 
                                product.getCreateDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "N/A");
                            variantRow.put("status", product.getStatus() != null && product.getStatus() == 1 ? "Active" : "Inactive");
                            variantRow.put("isVariant", true);
                            variantRow.put("variantDetails", "");
                            variantRow.put("variantSku", stockKeeping);
                            variantRow.put("variantStock", variant.getStock() != null ? variant.getStock() : 0);
                            variantRow.put("variantPrice", variant.getPrice() != null ? variant.getPrice().doubleValue() : 0.0);
                            
                            // Get variant attributes
                            List<VariantAttributeValue> variantAttributes = variantAttributeValueRepository.findByProductVariant(variant);
                            StringBuilder attributeDetails = new StringBuilder();
                            
                            if (variantAttributes != null && !variantAttributes.isEmpty()) {
                                for (VariantAttributeValue vav : variantAttributes) {
                                    if (vav != null && vav.getAttributeValue() != null && vav.getAttributeValue().getAttribute() != null) {
                                        String attrName = vav.getAttributeValue().getAttribute().getName();
                                        String attrValue = vav.getAttributeValue().getValue();
                                        
                                        if (attrName != null && attrValue != null) {
                                            // Check if it's a color attribute with hex value
                                            if (isColorAttribute(attrName) && isHexColor(attrValue)) {
                                                String hexCode = attrValue.trim();
                                                if (!hexCode.startsWith("#")) {
                                                    hexCode = "#" + hexCode;
                                                }
                                                String colorDisplay = getColorDisplay(hexCode);
                                                attributeDetails.append(attrName).append(": ● ").append(colorDisplay);
                                            } else {
                                                attributeDetails.append(attrName).append(": ").append(attrValue);
                                            }
                                            attributeDetails.append(", ");
                                        }
                                    }
                                }
                                if (attributeDetails.length() > 0) {
                                    attributeDetails.setLength(attributeDetails.length() - 2); // Remove last ", "
                                }
                            }
                            
                            if (attributeDetails.length() == 0) {
                                attributeDetails.append("No attributes");
                            }
                            
                            variantRow.put("variantAttributes", attributeDetails.toString());
                            reportData.add(variantRow);
                        } catch (Exception e) {
                            System.err.println("❌ Error processing variant: " + e.getMessage());
                            e.printStackTrace();
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("❌ Error processing product: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        return reportData;
    }

    // Helper method to check if attribute is a color attribute
    private boolean isColorAttribute(String attrName) {
        if (attrName == null) return false;
        String name = attrName.toLowerCase().trim();
        return name.equals("color") || name.equals("colors") || name.equals("colour") || name.equals("colours") || 
               name.contains("color") || name.contains("colour");
    }

    // Helper method to check if value is a hex color
    private boolean isHexColor(String value) {
        if (value == null) return false;
        String trimmed = value.trim();
        return trimmed.matches("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$") || 
               trimmed.matches("^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");
    }

    // Helper method to convert hex color to color name
    private String getColorNameFromHex(String hexCode) {
        if (hexCode == null) return "Unknown";
        
        String hex = hexCode.replace("#", "").toUpperCase();
        
        // Common color mappings
        switch (hex) {
            case "FF0000": return "Red";
            case "008000": return "Green";
            case "0000FF": return "Blue";
            case "FFFF00": return "Yellow";
            case "FFA500": return "Orange";
            case "800080": return "Purple";
            case "FFC0CB": return "Pink";
            case "A52A2A": return "Brown";
            case "808080": return "Gray";
            case "FFFFFF": return "White";
            case "000000": return "Black";
            case "FFD700": return "Gold";
            case "C0C0C0": return "Silver";
            case "FF69B4": return "Hot Pink";
            case "00CED1": return "Dark Turquoise";
            case "32CD32": return "Lime Green";
            case "FF6347": return "Tomato";
            case "9370DB": return "Medium Purple";
            case "20B2AA": return "Light Sea Green";
            case "FF4500": return "Orange Red";
            case "4169E1": return "Royal Blue";
            case "DC143C": return "Crimson";
            case "228B22": return "Forest Green";
            case "FF1493": return "Deep Pink";
            case "8B4513": return "Saddle Brown";
            case "2F4F4F": return "Dark Slate Gray";
            case "00FA9A": return "Medium Spring Green";
            case "FF8C00": return "Dark Orange";
            case "8A2BE2": return "Blue Violet";
            case "9400D3": return "Dark Violet";
            case "9932CC": return "Dark Orchid";
            case "8B008B": return "Dark Magenta";
            case "4B0082": return "Indigo";
            case "A0522D": return "Sienna";
            case "CD853F": return "Peru";
            case "DEB887": return "Burly Wood";
            case "F5DEB3": return "Wheat";
            case "D2B48C": return "Tan";
            case "BC8F8F": return "Rosy Brown";
            case "F4A460": return "Sandy Brown";
            case "696969": return "Dim Gray";
            case "A9A9A9": return "Dark Gray";
            case "D3D3D3": return "Light Gray";
            case "DCDCDC": return "Gainsboro";
            case "F5F5F5": return "White Smoke";
            case "FFFFF0": return "Ivory";
            case "FAF0E6": return "Linen";
            case "FDF5E6": return "Old Lace";
            case "FFEFD5": return "Peach Puff";
            case "FFE4B5": return "Moccasin";
            case "FFDAB9": return "Peach Puff";
            case "FFE4E1": return "Misty Rose";
            case "FFF0F5": return "Lavender Blush";
            case "F0FFF0": return "Honeydew";
            case "F5FFFA": return "Mint Cream";
            case "F0FFFF": return "Azure";
            case "F0F8FF": return "Alice Blue";
            case "E6F3FF": return "Ghost White";
            case "FFF8DC": return "Cornsilk";
            case "FFFAFA": return "Snow";
            case "F8F8FF": return "Ghost White";
            default: return hexCode;
        }
    }

    // Helper method to decide whether to show color name or hex code
    private String getColorDisplay(String hexCode) {
        if (hexCode == null) return "Unknown";
        
        String hex = hexCode.replace("#", "").toUpperCase();
        
        // List of hex codes that should remain as hex codes
        String[] keepAsHex = {
            "EB0F0F", "B22A99", "2320DF", "212529", "FF6B35", "4CAF50", "9C27B0", 
            "607D8B", "795548", "E91E63", "3F51B5", "009688", "FF9800", "8BC34A", 
            "CDDC39", "FFEB3B", "FFC107", "FF5722", "9E9E9E"
        };
        
        for (String keepHex : keepAsHex) {
            if (hex.equals(keepHex)) {
                return hexCode;
            }
        }
        
        return getColorNameFromHex(hexCode);
    }
} 