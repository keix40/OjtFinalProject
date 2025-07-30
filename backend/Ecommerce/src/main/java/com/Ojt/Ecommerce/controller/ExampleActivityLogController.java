package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.annotations.LogActivity;
import com.Ojt.Ecommerce.entity.ActivityLog;
import com.Ojt.Ecommerce.service.ActivityLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/example-logs")
public class ExampleActivityLogController {

    @Autowired
    private ActivityLogService activityLogService;

    // Example: Create a product (will show duration and entity details)
    @LogActivity(
        actionType = "CREATE",
        entityType = "PRODUCT",
        description = "Product created",
        severityLevel = "MEDIUM",
        entityIdParam = "productId",
        entityNameParam = "productName",
        logChanges = false
    )
    @PostMapping("/create-product")
    public ResponseEntity<?> createProduct(
            @RequestParam String productId,
            @RequestParam String productName,
            @RequestBody Map<String, Object> productData) {
        
        // Simulate some processing time
        try {
            Thread.sleep(150); // 150ms processing time
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Product created successfully");
        response.put("productId", productId);
        response.put("productName", productName);
        response.put("data", productData);
        
        return ResponseEntity.ok(response);
    }

    // Example: Update a product (will show before/after changes)
    @LogActivity(
        actionType = "UPDATE",
        entityType = "PRODUCT",
        description = "Product updated",
        severityLevel = "MEDIUM",
        entityIdParam = "productId",
        entityNameParam = "productName",
        logChanges = true
    )
    @PutMapping("/update-product")
    public ResponseEntity<?> updateProduct(
            @RequestParam String productId,
            @RequestParam String productName,
            @RequestBody Map<String, Object> updatedData) {
        
        // Simulate some processing time
        try {
            Thread.sleep(200); // 200ms processing time
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Return the updated data to show in changes
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Product updated successfully");
        response.put("productId", productId);
        response.put("productName", productName);
        response.put("name", updatedData.get("name"));
        response.put("price", updatedData.get("price"));
        response.put("description", updatedData.get("description"));
        
        return ResponseEntity.ok(response);
    }

    // Example: Create a user (will show duration and entity details)
    @LogActivity(
        actionType = "CREATE",
        entityType = "USER",
        description = "User created",
        severityLevel = "HIGH",
        entityIdParam = "userId",
        entityNameParam = "userName",
        logChanges = false
    )
    @PostMapping("/create-user")
    public ResponseEntity<?> createUser(
            @RequestParam String userId,
            @RequestParam String userName,
            @RequestBody Map<String, Object> userData) {
        
        // Simulate some processing time
        try {
            Thread.sleep(300); // 300ms processing time
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User created successfully");
        response.put("userId", userId);
        response.put("userName", userName);
        response.put("name", userData.get("name"));
        response.put("email", userData.get("email"));
        response.put("role", userData.get("role"));
        
        return ResponseEntity.ok(response);
    }

    // Example: Update a user (will show before/after changes)
    @LogActivity(
        actionType = "UPDATE",
        entityType = "USER",
        description = "User updated",
        severityLevel = "HIGH",
        entityIdParam = "userId",
        entityNameParam = "userName",
        logChanges = true
    )
    @PutMapping("/update-user")
    public ResponseEntity<?> updateUser(
            @RequestParam String userId,
            @RequestParam String userName,
            @RequestBody Map<String, Object> updatedData) {
        
        // Simulate some processing time
        try {
            Thread.sleep(250); // 250ms processing time
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Return the updated data to show in changes
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User updated successfully");
        response.put("userId", userId);
        response.put("userName", userName);
        response.put("name", updatedData.get("name"));
        response.put("email", updatedData.get("email"));
        response.put("role", updatedData.get("role"));
        
        return ResponseEntity.ok(response);
    }

    // Example: Delete a product (will show duration)
    @LogActivity(
        actionType = "DELETE",
        entityType = "PRODUCT",
        description = "Product deleted",
        severityLevel = "HIGH",
        entityIdParam = "productId",
        entityNameParam = "productName",
        logChanges = false
    )
    @DeleteMapping("/delete-product")
    public ResponseEntity<?> deleteProduct(
            @RequestParam String productId,
            @RequestParam String productName) {
        
        // Simulate some processing time
        try {
            Thread.sleep(100); // 100ms processing time
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Product deleted successfully");
        response.put("productId", productId);
        response.put("productName", productName);
        
        return ResponseEntity.ok(response);
    }

    // Example: Export data (will show duration)
    @LogActivity(
        actionType = "EXPORT",
        entityType = "DATA",
        description = "Data exported",
        severityLevel = "MEDIUM",
        entityIdParam = "exportType",
        entityNameParam = "fileName",
        logChanges = false
    )
    @PostMapping("/export-data")
    public ResponseEntity<?> exportData(
            @RequestParam String exportType,
            @RequestParam String fileName,
            @RequestBody Map<String, Object> exportConfig) {
        
        // Simulate export processing time
        try {
            Thread.sleep(500); // 500ms processing time
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Data exported successfully");
        response.put("exportType", exportType);
        response.put("fileName", fileName);
        response.put("recordCount", exportConfig.get("recordCount"));
        response.put("format", exportConfig.get("format"));
        
        return ResponseEntity.ok(response);
    }

    // Example: Import data (will show duration)
    @LogActivity(
        actionType = "IMPORT",
        entityType = "DATA",
        description = "Data imported",
        severityLevel = "MEDIUM",
        entityIdParam = "importType",
        entityNameParam = "fileName",
        logChanges = false
    )
    @PostMapping("/import-data")
    public ResponseEntity<?> importData(
            @RequestParam String importType,
            @RequestParam String fileName,
            @RequestBody Map<String, Object> importConfig) {
        
        // Simulate import processing time
        try {
            Thread.sleep(800); // 800ms processing time
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Data imported successfully");
        response.put("importType", importType);
        response.put("fileName", fileName);
        response.put("recordCount", importConfig.get("recordCount"));
        response.put("format", importConfig.get("format"));
        
        return ResponseEntity.ok(response);
    }

    // Example: View/Read operation (will show duration)
    @LogActivity(
        actionType = "VIEW",
        entityType = "REPORT",
        description = "Report viewed",
        severityLevel = "LOW",
        entityIdParam = "reportId",
        entityNameParam = "reportName",
        logChanges = false
    )
    @GetMapping("/view-report")
    public ResponseEntity<?> viewReport(
            @RequestParam String reportId,
            @RequestParam String reportName) {
        
        // Simulate report generation time
        try {
            Thread.sleep(120); // 120ms processing time
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Report viewed successfully");
        response.put("reportId", reportId);
        response.put("reportName", reportName);
        response.put("generatedAt", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
} 