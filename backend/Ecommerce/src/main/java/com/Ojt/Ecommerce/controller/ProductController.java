package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/product")
public class ProductController {
    @Autowired
    private ProductService service;

    @PostMapping("/create")
    public ResponseEntity<?> createProduct(@RequestPart("product")Product product, @RequestPart("images")MultipartFile[] images) throws IOException {
        Product proObj = service.saveProductImages(product,images);
        if (proObj == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to save product"));
        } else {
            return ResponseEntity.ok()
                    .body(Map.of("message", "Product created successfully"));
        }
    }
}
