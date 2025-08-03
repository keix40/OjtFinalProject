package com.Ojt.Ecommerce.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<?> handleCustomException(CustomException ex) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("timestamp", LocalDateTime.now());
        errorDetails.put("message", ex.getMessage());
        errorDetails.put("status", HttpStatus.BAD_REQUEST.value());

        return new ResponseEntity<>(errorDetails, HttpStatus.BAD_REQUEST);
    }

    // Special handler for report generation exceptions to return blob instead of JSON
    @ExceptionHandler(ReportGenerationException.class)
    public ResponseEntity<ByteArrayResource> handleReportGenerationException(ReportGenerationException ex) {
        System.err.println("❌ Report Generation Exception: " + ex.getMessage());
        return ResponseEntity.status(500)
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(new ByteArrayResource("Error generating report".getBytes()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex) {
        // Check if this is a report-related exception by looking at the stack trace
        StackTraceElement[] stackTrace = ex.getStackTrace();
        boolean isReportException = false;
        
        for (StackTraceElement element : stackTrace) {
            if (element.getClassName().contains("ProductReportController") || 
                element.getClassName().contains("JasperReportService")) {
                isReportException = true;
                break;
            }
        }
        
        // If it's a report exception, return blob response
        if (isReportException) {
            System.err.println("❌ Report Exception caught in GlobalExceptionHandler: " + ex.getMessage());
            return ResponseEntity.status(500)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new ByteArrayResource("Error generating report".getBytes()));
        }
        
        // Otherwise, return JSON response for other exceptions
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("timestamp", LocalDateTime.now());
        errorDetails.put("message", "Something went wrong: " + ex.getMessage());
        errorDetails.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());

        return new ResponseEntity<>(errorDetails, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("timestamp", LocalDateTime.now());
        String message = ex.getMessage();
        if (message != null && message.toLowerCase().contains("duplicate") && message.toLowerCase().contains("email")) {
            errorDetails.put("message", "Email already exists.");
        } else {
            errorDetails.put("message", "A data integrity error occurred.");
        }
        errorDetails.put("status", HttpStatus.BAD_REQUEST.value());
        return new ResponseEntity<>(errorDetails, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden: " + ex.getMessage());
    }
}
