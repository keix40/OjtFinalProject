package com.Ojt.Ecommerce.service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.entity.ProductVariant;
import com.Ojt.Ecommerce.entity.VariantAttributeValue;
import com.Ojt.Ecommerce.repository.ProductRepository;
import com.Ojt.Ecommerce.repository.ProductVariantRepository;
import com.Ojt.Ecommerce.repository.VariantAttributeValueRepository;


@Service
public class ProductReportService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private VariantAttributeValueRepository variantAttributeValueRepository;

    public byte[] generateProductReportExcel() throws Exception {
        try {
            // Create a simple CSV file
            StringBuilder csvContent = new StringBuilder();
            csvContent.append("Product Code,Product Name,Description,Quantity,Price,Status\n");
            csvContent.append("TEST001,Test Product,Test Description,10,100.0,Active\n");
            csvContent.append("TEST002,Another Product,Another Description,20,200.0,Active\n");
            
            return csvContent.toString().getBytes("UTF-8");
        } catch (Exception e) {
            System.err.println("Error generating Excel report: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

        public byte[] generateProductReportPDF() throws Exception {
        try {
            // Create a simple CSV file (same as Excel for now)
            StringBuilder csvContent = new StringBuilder();
            csvContent.append("Product Code,Product Name,Description,Quantity,Price,Status\n");
            csvContent.append("TEST001,Test Product,Test Description,10,100.0,Active\n");
            csvContent.append("TEST002,Another Product,Another Description,20,200.0,Active\n");
            
            return csvContent.toString().getBytes("UTF-8");
        } catch (Exception e) {
            System.err.println("Error generating PDF report: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }


} 