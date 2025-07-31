package com.Ojt.Ecommerce.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

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

import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.entity.ProductVariant;
import com.Ojt.Ecommerce.entity.VariantAttributeValue;
import com.Ojt.Ecommerce.repository.ProductRepository;
import com.Ojt.Ecommerce.repository.ProductVariantRepository;
import com.Ojt.Ecommerce.repository.VariantAttributeValueRepository;
// import com.Ojt.Ecommerce.service.ProfessionalExcelReportService;

import java.time.format.DateTimeFormatter;
import java.util.List;



@RestController
@RequestMapping("/api/product-reports")
@CrossOrigin(origins = "http://localhost:4200")
public class ProductReportController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private VariantAttributeValueRepository variantAttributeValueRepository;

    // @Autowired
    // private ProfessionalExcelReportService professionalExcelReportService;



    @GetMapping("/excel")
    public ResponseEntity<ByteArrayResource> exportProductReportToExcel() {
        try {
            return exportProductReportToExcelWithIds(null);
        } catch (Exception e) {
            System.err.println("Error in exportProductReportToExcel: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Backend is working!");
    }

    @PostMapping("/excel/selected")
    public ResponseEntity<ByteArrayResource> exportSelectedProductsToExcel(@RequestBody List<Long> productIds) {
        return exportProductReportToExcelWithIds(productIds);
    }

    private ResponseEntity<ByteArrayResource> exportProductReportToExcelWithIds(List<Long> selectedProductIds) {
        try {
            // For now, use CSV report directly to avoid Apache POI issues
            return generateCSVReport(selectedProductIds);
                
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private ResponseEntity<ByteArrayResource> generateCSVReport(List<Long> selectedProductIds) {
        try {
            // Get real product data from database
            List<Product> products;
            if (selectedProductIds != null && !selectedProductIds.isEmpty()) {
                // Get only selected products
                products = productRepository.findAllById(selectedProductIds);
            } else {
                // Get all products
                products = productRepository.findAllProduct();
            }
            
            StringBuilder csvContent = new StringBuilder();
            csvContent.append("Product Code,Product Name,Description,Quantity,Price (MMK),Create Date,Status,Variant Details\n");
            
            for (Product product : products) {
                if (product == null) continue;
                
                // Add main product data
                String productCode = product.getProductCode() != null ? product.getProductCode() : "N/A";
                String productName = product.getProductName() != null ? product.getProductName() : "N/A";
                String description = product.getDescription() != null ? product.getDescription() : "N/A";
                Long quantity = product.getQuantity() != null ? product.getQuantity() : 0L;
                Double price = product.getPrice() != null ? product.getPrice() : 0.0;
                String createDate = product.getCreateDate() != null ? 
                    product.getCreateDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "N/A";
                String status = product.getStatus() != null && product.getStatus() == 1 ? "Active" : "Inactive";
                
                // Check if product has variants
                List<ProductVariant> variants = productVariantRepository.findByProduct(product);
                String variantDetails = variants != null && !variants.isEmpty() ? "Yes" : "No";
                
                // Escape commas and quotes in CSV
                productCode = escapeCsvField(productCode);
                productName = escapeCsvField(productName);
                description = escapeCsvField(description);
                
                csvContent.append(String.format("%s,%s,%s,%d,%.2f,%s,%s,%s\n", 
                    productCode, productName, description, quantity, price, createDate, status, variantDetails));
                
                // Add variant data if exists
                if (variants != null && !variants.isEmpty()) {
                    for (ProductVariant variant : variants) {
                        if (variant == null) continue;
                        
                        String variantSku = variant.getStockKeeping() != null ? variant.getStockKeeping() : "N/A";
                        Integer variantStock = variant.getStock() != null ? variant.getStock() : 0;
                        Double variantPrice = variant.getPrice() != null ? variant.getPrice().doubleValue() : 0.0;
                        
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
                                            // Ensure hex code has # prefix
                                            String hexCode = attrValue.trim();
                                            if (!hexCode.startsWith("#")) {
                                                hexCode = "#" + hexCode;
                                            }
                                            // Convert hex to color name or keep hex based on preference
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
                        
                        // For variants, use simple indentation without special characters
                        String indentedSku = "  - " + variantSku;
                        String indentedName = "  - " + productName;
                        String indentedDesc = "  - " + description;
                        
                        // Escape CSV fields
                        indentedSku = escapeCsvField(indentedSku);
                        indentedName = escapeCsvField(indentedName);
                        indentedDesc = escapeCsvField(indentedDesc);
                        String attributes = escapeCsvField(attributeDetails.toString());
                        
                        csvContent.append(String.format("%s,%s,%s,%d,%.2f,%s,%s,%s\n", 
                            indentedSku, indentedName, indentedDesc, variantStock, variantPrice, createDate, status, attributes));
                    }
                }
            }
            
            // Add BOM for proper UTF-8 encoding
            byte[] bom = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
            byte[] contentBytes = csvContent.toString().getBytes("UTF-8");
            byte[] reportBytes = new byte[bom.length + contentBytes.length];
            System.arraycopy(bom, 0, reportBytes, 0, bom.length);
            System.arraycopy(contentBytes, 0, reportBytes, bom.length, contentBytes.length);
            
            String fileName = "Britium_Gallery_Product_Report_" + 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm")) + ".csv";
            
            ByteArrayResource resource = new ByteArrayResource(reportBytes);
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .contentLength(reportBytes.length)
                .body(resource);
                
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/pdf")
    public ResponseEntity<ByteArrayResource> exportProductReportToPDF() {
        return exportProductReportToPDFWithIds(null);
    }

    @PostMapping("/pdf/selected")
    public ResponseEntity<ByteArrayResource> exportSelectedProductsToPDF(@RequestBody List<Long> productIds) {
        return exportProductReportToPDFWithIds(productIds);
    }

    private ResponseEntity<ByteArrayResource> exportProductReportToPDFWithIds(List<Long> selectedProductIds) {
        try {
            // Use the same real data as Excel export
            return exportProductReportToExcelWithIds(selectedProductIds);
                
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Helper method to escape CSV fields
    private String escapeCsvField(String field) {
        if (field == null) return "";
        // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (field.contains(",") || field.contains("\"") || field.contains("\n")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
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
        // Check for hex color with or without #
        return trimmed.matches("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$") || 
               trimmed.matches("^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");
    }

    // Helper method to convert hex color to color name
    private String getColorNameFromHex(String hexCode) {
        if (hexCode == null) return "Unknown";
        
        // Normalize hex code (remove # and convert to uppercase)
        String hex = hexCode.replace("#", "").toUpperCase();
        
        // Common color mappings
        switch (hex) {
            // Red variations
            case "FF0000": return "Red";
            case "DC143C": return "Crimson";
            case "B22222": return "Fire Brick";
            case "CD5C5C": return "Indian Red";
            case "F08080": return "Light Coral";
            case "FA8072": return "Salmon";
            case "E9967A": return "Dark Salmon";
            case "FFA07A": return "Light Salmon";
            case "FF4500": return "Orange Red";
            case "FF6347": return "Tomato";
            case "FF7F50": return "Coral";
            
            // Green variations
            case "008000": return "Green";
            case "228B22": return "Forest Green";
            case "32CD32": return "Lime Green";
            case "90EE90": return "Light Green";
            case "98FB98": return "Pale Green";
            case "00FF00": return "Lime";
            case "00FA9A": return "Medium Spring Green";
            case "00CED1": return "Dark Turquoise";
            case "006400": return "Dark Green";
            case "ADFF2F": return "Green Yellow";
            case "7FFF00": return "Chartreuse";
            
            // Blue variations
            case "0000FF": return "Blue";
            case "000080": return "Navy";
            case "00008B": return "Dark Blue";
            case "0000CD": return "Medium Blue";
            case "4169E1": return "Royal Blue";
            case "1E90FF": return "Dodger Blue";
            case "00BFFF": return "Deep Sky Blue";
            case "87CEEB": return "Sky Blue";
            case "87CEFA": return "Light Sky Blue";
            case "4682B4": return "Steel Blue";
            case "B0C4DE": return "Light Steel Blue";
            case "ADD8E6": return "Light Blue";
            case "B0E0E6": return "Powder Blue";
            case "AFEEEE": return "Pale Turquoise";
            case "40E0D0": return "Turquoise";
            case "48D1CC": return "Medium Turquoise";
            case "20B2AA": return "Light Sea Green";
            case "5F9EA0": return "Cadet Blue";
            
            // Yellow/Orange variations
            case "FFFF00": return "Yellow";
            case "FFD700": return "Gold";
            case "FFA500": return "Orange";
            case "FF8C00": return "Dark Orange";
            case "B8860B": return "Dark Goldenrod";
            case "DAA520": return "Goldenrod";
            case "BDB76B": return "Dark Khaki";
            case "F0E68C": return "Khaki";
            case "EEE8AA": return "Pale Goldenrod";
            case "FAFAD2": return "Light Goldenrod Yellow";
            case "FFFFE0": return "Light Yellow";
            
            // Pink/Purple variations
            case "FF69B4": return "Hot Pink";
            case "FF1493": return "Deep Pink";
            case "FFC0CB": return "Pink";
            case "FFB6C1": return "Light Pink";
            case "DDA0DD": return "Plum";
            case "D8BFD8": return "Thistle";
            case "E6E6FA": return "Lavender";
            case "9370DB": return "Medium Purple";
            case "8A2BE2": return "Blue Violet";
            case "9400D3": return "Dark Violet";
            case "9932CC": return "Dark Orchid";
            case "8B008B": return "Dark Magenta";
            case "800080": return "Purple";
            case "4B0082": return "Indigo";
            
            // Brown variations
            case "8B4513": return "Saddle Brown";
            case "A0522D": return "Sienna";
            case "CD853F": return "Peru";
            case "DEB887": return "Burly Wood";
            case "F5DEB3": return "Wheat";
            case "D2B48C": return "Tan";
            case "BC8F8F": return "Rosy Brown";
            case "F4A460": return "Sandy Brown";
            
            // Gray variations
            case "2F4F4F": return "Dark Slate Gray";
            case "696969": return "Dim Gray";
            case "808080": return "Gray";
            case "A9A9A9": return "Dark Gray";
            case "C0C0C0": return "Silver";
            case "D3D3D3": return "Light Gray";
            case "DCDCDC": return "Gainsboro";
            case "F5F5F5": return "White Smoke";
            
            // White/Black
            case "FFFFFF": return "White";
            case "000000": return "Black";
            
            // Light colors
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
            
            default: return hexCode; // Return original hex if no match found
        }
    }

    // Helper method to decide whether to show color name or hex code
    private String getColorDisplay(String hexCode) {
        if (hexCode == null) return "Unknown";
        
        // Normalize hex code (remove # and convert to uppercase)
        String hex = hexCode.replace("#", "").toUpperCase();
        
        // List of hex codes that should remain as hex codes (not converted to names)
        // Add the specific hex codes you want to keep as hex
        String[] keepAsHex = {
            "EB0F0F",  // Custom red
            "B22A99",  // Custom purple
            "2320DF",  // Custom blue
            "212529",  // Custom dark gray
            "FF6B35",  // Custom orange
            "4CAF50",  // Custom green
            "9C27B0",  // Custom purple
            "607D8B",  // Custom blue gray
            "795548",  // Custom brown
            "E91E63",  // Custom pink
            "3F51B5",  // Custom indigo
            "009688",  // Custom teal
            "FF9800",  // Custom orange
            "8BC34A",  // Custom light green
            "CDDC39",  // Custom lime
            "FFEB3B",  // Custom yellow
            "FFC107",  // Custom amber
            "FF5722",  // Custom deep orange
            "9E9E9E",  // Custom gray
            "607D8B"   // Custom blue gray
        };
        
        // Check if this hex should be kept as hex
        for (String keepHex : keepAsHex) {
            if (hex.equals(keepHex)) {
                return hexCode; // Return original hex code
            }
        }
        
        // For other colors, convert to name
        return getColorNameFromHex(hexCode);
    }
} 