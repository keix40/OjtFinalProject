package com.Ojt.Ecommerce.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final String[] STATIC_ASSET_PREFIXES = {
            "/product_image/",
            "/uploads/",
            "/review/",
            "/return_images/",
            "/brand_and_category_image/",
            "/event/"
    };

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<?> handleNoResourceFound(NoResourceFoundException ex, HttpServletRequest request) {
        String path = request.getRequestURI();
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("timestamp", LocalDateTime.now());
        errorDetails.put(
                "message",
                isStaticAssetPath(path) ? "Static asset not found" : "Resource not found");
        errorDetails.put("status", HttpStatus.NOT_FOUND.value());
        return new ResponseEntity<>(errorDetails, HttpStatus.NOT_FOUND);
    }

    private static boolean isStaticAssetPath(String path) {
        if (path == null) {
            return false;
        }
        for (String prefix : STATIC_ASSET_PREFIXES) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("timestamp", LocalDateTime.now());
        errorDetails.put("status", HttpStatus.BAD_REQUEST.value());
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }
        errorDetails.put("errors", fieldErrors);
        errorDetails.put("message", "Validation failed");
        return new ResponseEntity<>(errorDetails, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<?> handleAuthenticationException(AuthenticationException ex) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("timestamp", LocalDateTime.now());
        errorDetails.put("message", "Invalid email or password.");
        errorDetails.put("status", HttpStatus.UNAUTHORIZED.value());
        return new ResponseEntity<>(errorDetails, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(EmailDeliveryException.class)
    public ResponseEntity<?> handleEmailDeliveryException(EmailDeliveryException ex) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("timestamp", LocalDateTime.now());
        errorDetails.put("message", ex.getMessage());
        errorDetails.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        return new ResponseEntity<>(errorDetails, HttpStatus.SERVICE_UNAVAILABLE);
    }

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
