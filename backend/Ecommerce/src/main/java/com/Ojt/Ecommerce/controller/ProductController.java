package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.ProductDTO;
import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.service.ProductService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/product")
public class ProductController {
    @Autowired
    private ProductService service;

    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createProduct(
            @RequestPart("product") ProductDTO dto,
            @RequestPart("images") MultipartFile[] images,
            @RequestParam MultiValueMap<String, MultipartFile> fileMap) throws IOException {//for multiple image for varient
        System.out.println("productDto debug"+dto);
        System.out.println("Product name: " + dto.getProductName());
        System.out.println("Number of images: " + images.length);
        List<MultipartFile[]> variantImagesList = new ArrayList<>();

        Map<String, List<MultipartFile>> variantImageMap = new HashMap<>();
        for (Map.Entry<String, List<MultipartFile>> entry : fileMap.entrySet()) {
            String key = entry.getKey();
            if (key.startsWith("variantImages_")) {
                variantImageMap.put(key, entry.getValue());
            }
        }
        Product savedProduct = service.saveProductWithImages(dto, images,variantImageMap);

        if (savedProduct == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to save product"));
        }

        return ResponseEntity.ok(Map.of("message", "Product created successfully"));
    }



//    @GetMapping("/getallproduct")
//    public List<Product> getAllProduct(){
//        return service.getAllProduct();
//    }

    //fixing error get all product 6.15.25
    @GetMapping("/getallproduct")
    public ResponseEntity<List<ProductDTO>> getAllProduct() {
        return ResponseEntity.ok(service.getAllProduct());
    }

    @GetMapping("/productlist")
    public List<ProductDTO> getAllActiveProducts() {
        return service.getAllActiveProductDTOs();
    }

    @PutMapping("/delete/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable Long id){
        service.deleteProduct(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Delete Product successfully.");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/active/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> activeProduct(@PathVariable Long id){
        service.activeProduct(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Active product successfully.");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/inactive/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> inactiveProduct(@PathVariable Long id){
        service.inactiveProduct(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Inactive Product successfully.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/adminProductDetail/{id}")
    public ResponseEntity<?> getProductDetail(@PathVariable Long id) {
        ProductDTO product = service.getProductDetailById(id);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(product);
    }


}
