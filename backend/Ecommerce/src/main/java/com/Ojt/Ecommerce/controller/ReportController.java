package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.CustomerSummaryDTO;
import com.Ojt.Ecommerce.service.UserService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private UserService userService;

    /**
     * Export customers data as a styled Excel file
     * This endpoint generates a professional Excel report with:
     * - Bold, colored title
     * - Colored header row
     * - Centered and bold data
     * - Green color for money column
     * - All borders for clean presentation
     */
    @GetMapping("/customers/excel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> exportCustomersToExcel() {
        try {
            // Get customer data from service
            List<CustomerSummaryDTO> customers = userService.getCustomersForReport();
            
            // Create workbook and worksheet
            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("Customers Report");
            
            // Create styles
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle moneyStyle = createMoneyStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);
            
            // Create title row
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("CUSTOMER MANAGEMENT REPORT");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 8)); // Merge across all columns
            
            // Create header row
            Row headerRow = sheet.createRow(2);
            String[] headers = {"ID", "Name", "Email", "Phone", "Status", "Role", "Join Date", "Total Orders", "Total Spent"};
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 15 * 256); // Set column width
            }
            
            // Add data rows
            int rowNum = 3;
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            
            for (CustomerSummaryDTO customer : customers) {
                Row row = sheet.createRow(rowNum);
                
                // ID
                Cell idCell = row.createCell(0);
                idCell.setCellValue(customer.getUserId());
                idCell.setCellStyle(dataStyle);
                
                // Name
                Cell nameCell = row.createCell(1);
                nameCell.setCellValue(customer.getName());
                nameCell.setCellStyle(dataStyle);
                
                // Email
                Cell emailCell = row.createCell(2);
                emailCell.setCellValue(customer.getEmail());
                emailCell.setCellStyle(dataStyle);
                
                // Phone
                Cell phoneCell = row.createCell(3);
                phoneCell.setCellValue(customer.getPhoneNumber());
                phoneCell.setCellStyle(dataStyle);
                
                // Status
                Cell statusCell = row.createCell(4);
                statusCell.setCellValue(customer.getStatus());
                statusCell.setCellStyle(dataStyle);
                
                // Role
                Cell roleCell = row.createCell(5);
                roleCell.setCellValue(customer.getRoleName());
                roleCell.setCellStyle(dataStyle);
                
                // Join Date
                Cell dateCell = row.createCell(6);
                dateCell.setCellValue(customer.getJoinDate().format(dateFormatter));
                dateCell.setCellStyle(dateStyle);
                
                // Total Orders
                Cell ordersCell = row.createCell(7);
                ordersCell.setCellValue(customer.getTotalOrders());
                ordersCell.setCellStyle(dataStyle);
                
                // Total Spent (money column - green)
                Cell spentCell = row.createCell(8);
                spentCell.setCellValue(customer.getTotalSpent());
                spentCell.setCellStyle(moneyStyle);
                
                rowNum++;
            }
            
            // Write to ByteArrayOutputStream
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            workbook.close();
            
            // Create response
            ByteArrayResource resource = new ByteArrayResource(outputStream.toByteArray());
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=customers_report.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);
                    
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Create title style with bold font and blue background
     */
    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }
    
    /**
     * Create header style with bold font and gray background
     */
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_50_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
    
    /**
     * Create data style with centered alignment and borders
     */
    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
    
    /**
     * Create money style with green color and currency format
     */
    private CellStyle createMoneyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setColor(IndexedColors.GREEN.getIndex());
        font.setBold(true);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        
        // Add currency format
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("$#,##0.00"));
        
        return style;
    }
    
    /**
     * Create date style with date format
     */
    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        
        // Add date format
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("yyyy-mm-dd hh:mm"));
        
        return style;
    }
} 