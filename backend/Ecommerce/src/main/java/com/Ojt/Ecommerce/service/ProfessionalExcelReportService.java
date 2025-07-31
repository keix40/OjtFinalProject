package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.entity.ProductVariant;
import com.Ojt.Ecommerce.entity.VariantAttributeValue;
import com.Ojt.Ecommerce.repository.ProductRepository;
import com.Ojt.Ecommerce.repository.ProductVariantRepository;
import com.Ojt.Ecommerce.repository.VariantAttributeValueRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ProfessionalExcelReportService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private VariantAttributeValueRepository variantAttributeValueRepository;

    public byte[] generateProfessionalExcelReport(List<Long> selectedProductIds) throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Product Inventory Report");

            // Create styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle subHeaderStyle = createSubHeaderStyle(workbook);
            CellStyle normalStyle = createNormalStyle(workbook);
            CellStyle summaryStyle = createSummaryStyle(workbook);
            CellStyle tableHeaderStyle = createTableHeaderStyle(workbook);

            // Set column widths
            setColumnWidths(sheet);

            int currentRow = 0;

            // Company Header (Row 1-3)
            currentRow = createCompanyHeader(sheet, headerStyle, subHeaderStyle, currentRow);

            // Report Summary (Row 4-7)
            currentRow = createReportSummary(sheet, summaryStyle, normalStyle, currentRow, selectedProductIds);

            // Empty row
            currentRow++;

            // Table Headers (Row 9)
            currentRow = createTableHeaders(sheet, tableHeaderStyle, currentRow);

            // Table Data
            currentRow = populateTableData(sheet, normalStyle, currentRow, selectedProductIds);

            // Auto-size columns for better fit
            for (int i = 0; i < 8; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write to byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();

        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontName("Arial");
        font.setFontHeightInPoints((short) 20);
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createSubHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontName("Arial");
        font.setFontHeightInPoints((short) 14);
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createNormalStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontName("Arial");
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createSummaryStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontName("Arial");
        font.setFontHeightInPoints((short) 11);
        font.setBold(true);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createTableHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontName("Arial");
        font.setFontHeightInPoints((short) 11);
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setWrapText(true);
        return style;
    }

    private void setColumnWidths(Sheet sheet) {
        sheet.setColumnWidth(0, 15 * 256); // Product Code
        sheet.setColumnWidth(1, 25 * 256); // Product Name
        sheet.setColumnWidth(2, 40 * 256); // Description (wider for text wrapping)
        sheet.setColumnWidth(3, 12 * 256); // Quantity
        sheet.setColumnWidth(4, 15 * 256); // Price
        sheet.setColumnWidth(5, 15 * 256); // Create Date
        sheet.setColumnWidth(6, 12 * 256); // Status
        sheet.setColumnWidth(7, 35 * 256); // Variant Details
    }

    private int createCompanyHeader(Sheet sheet, CellStyle headerStyle, CellStyle subHeaderStyle, int currentRow) {
        // Company Name (Row 1)
        Row companyRow = sheet.createRow(currentRow);
        companyRow.setHeight((short) (30 * 20)); // Set row height
        Cell companyCell = companyRow.createCell(2); // Start from column C
        companyCell.setCellValue("BRITIUM GALLERY");
        companyCell.setCellStyle(headerStyle);
        sheet.addMergedRegion(new CellRangeAddress(currentRow, currentRow, 2, 5)); // Merge C to F

        // Report Title (Row 2)
        currentRow++;
        Row titleRow = sheet.createRow(currentRow);
        titleRow.setHeight((short) (25 * 20));
        Cell titleCell = titleRow.createCell(2);
        titleCell.setCellValue("Product Inventory Report");
        titleCell.setCellStyle(subHeaderStyle);
        sheet.addMergedRegion(new CellRangeAddress(currentRow, currentRow, 2, 5));

        return currentRow + 1;
    }

    private int createReportSummary(Sheet sheet, CellStyle summaryStyle, CellStyle normalStyle, int currentRow, List<Long> selectedProductIds) {
        // Get product data
        List<Product> products;
        if (selectedProductIds != null && !selectedProductIds.isEmpty()) {
            products = productRepository.findAllById(selectedProductIds);
        } else {
            products = productRepository.findAllProduct();
        }

        // Calculate statistics
        long totalProducts = products.size();
        long activeProducts = products.stream().filter(p -> p.getStatus() != null && p.getStatus() == 1).count();
        long inactiveProducts = totalProducts - activeProducts;

        // Generation timestamp
        Row timestampRow = sheet.createRow(currentRow);
        Cell timestampCell = timestampRow.createCell(0);
        timestampCell.setCellValue("Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMMM yyyy 'at' HH:mm")));
        timestampCell.setCellStyle(normalStyle);

        // Total Products
        currentRow++;
        Row totalRow = sheet.createRow(currentRow);
        Cell totalCell = totalRow.createCell(0);
        totalCell.setCellValue("Total Products: " + totalProducts);
        totalCell.setCellStyle(summaryStyle);

        // Active Products
        currentRow++;
        Row activeRow = sheet.createRow(currentRow);
        Cell activeCell = activeRow.createCell(0);
        activeCell.setCellValue("Active Products: " + activeProducts);
        activeCell.setCellStyle(summaryStyle);

        // Inactive Products
        currentRow++;
        Row inactiveRow = sheet.createRow(currentRow);
        Cell inactiveCell = inactiveRow.createCell(0);
        inactiveCell.setCellValue("Inactive Products: " + inactiveProducts);
        inactiveCell.setCellStyle(summaryStyle);

        return currentRow + 1;
    }

    private int createTableHeaders(Sheet sheet, CellStyle tableHeaderStyle, int currentRow) {
        Row headerRow = sheet.createRow(currentRow);
        headerRow.setHeight((short) (25 * 20));

        String[] headers = {
            "Product Code", "Product Name", "Description", "Quantity", 
            "Price (MMK)", "Create Date", "Status", "Variant Details"
        };

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(tableHeaderStyle);
        }

        return currentRow + 1;
    }

    private int populateTableData(Sheet sheet, CellStyle normalStyle, int currentRow, List<Long> selectedProductIds) {
        // Get product data
        List<Product> products;
        if (selectedProductIds != null && !selectedProductIds.isEmpty()) {
            products = productRepository.findAllById(selectedProductIds);
        } else {
            products = productRepository.findAllProduct();
        }

        for (Product product : products) {
            if (product == null) continue;

            // Main product row
            Row productRow = sheet.createRow(currentRow);
            productRow.setHeight((short) (20 * 20));

            // Product Code
            Cell codeCell = productRow.createCell(0);
            codeCell.setCellValue(product.getProductCode() != null ? product.getProductCode() : "N/A");
            codeCell.setCellStyle(normalStyle);

            // Product Name
            Cell nameCell = productRow.createCell(1);
            nameCell.setCellValue(product.getProductName() != null ? product.getProductName() : "N/A");
            nameCell.setCellStyle(normalStyle);

            // Description
            Cell descCell = productRow.createCell(2);
            descCell.setCellValue(product.getDescription() != null ? product.getDescription() : "N/A");
            descCell.setCellStyle(normalStyle);

            // Quantity
            Cell qtyCell = productRow.createCell(3);
            qtyCell.setCellValue(product.getQuantity() != null ? product.getQuantity() : 0);
            qtyCell.setCellStyle(normalStyle);

            // Price
            Cell priceCell = productRow.createCell(4);
            priceCell.setCellValue(product.getPrice() != null ? product.getPrice() : 0.0);
            priceCell.setCellStyle(normalStyle);

            // Create Date
            Cell dateCell = productRow.createCell(5);
            dateCell.setCellValue(product.getCreateDate() != null ? 
                product.getCreateDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "N/A");
            dateCell.setCellStyle(normalStyle);

            // Status
            Cell statusCell = productRow.createCell(6);
            statusCell.setCellValue(product.getStatus() != null && product.getStatus() == 1 ? "Active" : "Inactive");
            statusCell.setCellStyle(normalStyle);

            // Variant Details
            Cell variantCell = productRow.createCell(7);
            List<ProductVariant> variants = productVariantRepository.findByProduct(product);
            variantCell.setCellValue(variants != null && !variants.isEmpty() ? "Yes" : "No");
            variantCell.setCellStyle(normalStyle);

            currentRow++;

            // Add variant rows
            if (variants != null && !variants.isEmpty()) {
                for (ProductVariant variant : variants) {
                    if (variant == null) continue;

                    Row variantRow = sheet.createRow(currentRow);
                    variantRow.setHeight((short) (20 * 20));

                    // Variant Code (indented)
                    Cell vCodeCell = variantRow.createCell(0);
                    vCodeCell.setCellValue("L " + (variant.getStockKeeping() != null ? variant.getStockKeeping() : "N/A"));
                    vCodeCell.setCellStyle(normalStyle);

                    // Variant Name (indented)
                    Cell vNameCell = variantRow.createCell(1);
                    vNameCell.setCellValue("L " + (product.getProductName() != null ? product.getProductName() : "N/A"));
                    vNameCell.setCellStyle(normalStyle);

                    // Variant Description (indented)
                    Cell vDescCell = variantRow.createCell(2);
                    vDescCell.setCellValue("L " + (product.getDescription() != null ? product.getDescription() : "N/A"));
                    vDescCell.setCellStyle(normalStyle);

                    // Variant Quantity
                    Cell vQtyCell = variantRow.createCell(3);
                    vQtyCell.setCellValue(variant.getStock() != null ? variant.getStock() : 0);
                    vQtyCell.setCellStyle(normalStyle);

                    // Variant Price
                    Cell vPriceCell = variantRow.createCell(4);
                    vPriceCell.setCellValue(variant.getPrice() != null ? variant.getPrice().doubleValue() : 0.0);
                    vPriceCell.setCellStyle(normalStyle);

                    // Variant Date (same as product)
                    Cell vDateCell = variantRow.createCell(5);
                    vDateCell.setCellValue(product.getCreateDate() != null ? 
                        product.getCreateDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "N/A");
                    vDateCell.setCellStyle(normalStyle);

                    // Variant Status (same as product)
                    Cell vStatusCell = variantRow.createCell(6);
                    vStatusCell.setCellValue(product.getStatus() != null && product.getStatus() == 1 ? "Active" : "Inactive");
                    vStatusCell.setCellStyle(normalStyle);

                    // Variant Attributes
                    Cell vAttrCell = variantRow.createCell(7);
                    List<VariantAttributeValue> variantAttributes = variantAttributeValueRepository.findByProductVariant(variant);
                    StringBuilder attributeDetails = new StringBuilder();

                    if (variantAttributes != null && !variantAttributes.isEmpty()) {
                        for (VariantAttributeValue vav : variantAttributes) {
                            if (vav != null && vav.getAttributeValue() != null && vav.getAttributeValue().getAttribute() != null) {
                                String attrName = vav.getAttributeValue().getAttribute().getName();
                                String attrValue = vav.getAttributeValue().getValue();

                                if (attrName != null && attrValue != null) {
                                    if (isColorAttribute(attrName) && isHexColor(attrValue)) {
                                        String colorDisplay = getColorDisplay(attrValue);
                                        attributeDetails.append(attrName).append(": ● ").append(colorDisplay);
                                    } else {
                                        attributeDetails.append(attrName).append(": ").append(attrValue);
                                    }
                                    attributeDetails.append(", ");
                                }
                            }
                        }
                        if (attributeDetails.length() > 0) {
                            attributeDetails.setLength(attributeDetails.length() - 2);
                        }
                    }

                    if (attributeDetails.length() == 0) {
                        attributeDetails.append("No attributes");
                    }

                    vAttrCell.setCellValue(attributeDetails.toString());
                    vAttrCell.setCellStyle(normalStyle);

                    currentRow++;
                }
            }
        }

        return currentRow;
    }

    // Helper methods for color handling (copied from ProductReportController)
    private boolean isColorAttribute(String attrName) {
        if (attrName == null) return false;
        String name = attrName.toLowerCase().trim();
        return name.equals("color") || name.equals("colors") || name.equals("colour") || name.equals("colours") || 
               name.contains("color") || name.contains("colour");
    }

    private boolean isHexColor(String value) {
        if (value == null) return false;
        String trimmed = value.trim();
        return trimmed.matches("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$") || 
               trimmed.matches("^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");
    }

    private String getColorDisplay(String hexCode) {
        if (hexCode == null) return "Unknown";
        
        String hex = hexCode.replace("#", "").toUpperCase();
        
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

    private String getColorNameFromHex(String hexCode) {
        if (hexCode == null) return "Unknown";
        
        String hex = hexCode.replace("#", "").toUpperCase();
        
        switch (hex) {
            case "FF0000": return "Red";
            case "0000FF": return "Blue";
            case "008000": return "Green";
            case "FFFF00": return "Yellow";
            case "FF69B4": return "Hot Pink";
            case "800080": return "Purple";
            case "FFFFFF": return "White";
            case "000000": return "Black";
            case "808080": return "Gray";
            case "FFA500": return "Orange";
            case "FFC0CB": return "Pink";
            case "00FF00": return "Lime";
            case "FF1493": return "Deep Pink";
            case "9370DB": return "Medium Purple";
            case "32CD32": return "Lime Green";
            case "228B22": return "Forest Green";
            case "4169E1": return "Royal Blue";
            case "87CEEB": return "Sky Blue";
            case "FFD700": return "Gold";
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
            case "90EE90": return "Light Green";
            case "98FB98": return "Pale Green";
            case "00FA9A": return "Medium Spring Green";
            case "00CED1": return "Dark Turquoise";
            case "006400": return "Dark Green";
            case "ADFF2F": return "Green Yellow";
            case "7FFF00": return "Chartreuse";
            case "000080": return "Navy";
            case "00008B": return "Dark Blue";
            case "0000CD": return "Medium Blue";
            case "1E90FF": return "Dodger Blue";
            case "00BFFF": return "Deep Sky Blue";
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
            case "FF8C00": return "Dark Orange";
            case "B8860B": return "Dark Goldenrod";
            case "DAA520": return "Goldenrod";
            case "BDB76B": return "Dark Khaki";
            case "F0E68C": return "Khaki";
            case "EEE8AA": return "Pale Goldenrod";
            case "FAFAD2": return "Light Goldenrod Yellow";
            case "FFFFE0": return "Light Yellow";
            case "FFB6C1": return "Light Pink";
            case "DDA0DD": return "Plum";
            case "D8BFD8": return "Thistle";
            case "E6E6FA": return "Lavender";
            case "8A2BE2": return "Blue Violet";
            case "9400D3": return "Dark Violet";
            case "9932CC": return "Dark Orchid";
            case "8B008B": return "Dark Magenta";
            case "4B0082": return "Indigo";
            case "8B4513": return "Saddle Brown";

            case "A0522D": return "Sienna";
            case "CD853F": return "Peru";
            case "DEB887": return "Burly Wood";
            case "F5DEB3": return "Wheat";
            case "D2B48C": return "Tan";
            case "BC8F8F": return "Rosy Brown";
            case "F4A460": return "Sandy Brown";
            case "2F4F4F": return "Dark Slate Gray";
            case "696969": return "Dim Gray";
            case "A9A9A9": return "Dark Gray";
            case "C0C0C0": return "Silver";
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
} 