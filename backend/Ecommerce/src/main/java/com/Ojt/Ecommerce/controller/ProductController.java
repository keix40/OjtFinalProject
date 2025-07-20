package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.ProductDTO;
import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.service.ProductService;
import com.Ojt.Ecommerce.annotations.LogActivity;
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

    @LogActivity(actionType = "CREATE", entityType = "PRODUCT", description = "Created product", severityLevel = "MEDIUM")
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createProduct(
            @RequestPart("product") ProductDTO dto,
            @RequestPart("images") MultipartFile[] images,
            @RequestParam MultiValueMap<String, MultipartFile> fileMap) throws IOException {

        Map<String, List<MultipartFile>> variantImageMap = new HashMap<>();
        for (Map.Entry<String, List<MultipartFile>> entry : fileMap.entrySet()) {
            String key = entry.getKey();
            if (key.startsWith("variantImages_")) {
                variantImageMap.put(key, entry.getValue());
            }
        }

        Product savedProduct = service.saveProductWithImages(dto, images, variantImageMap);

        if (savedProduct == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to save product"));
        }

        return ResponseEntity.ok(Map.of("message", "Product created successfully"));
    }

    @PostMapping("/by-ids")
    public List<ProductDTO> getProductsByIds(@RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.get("ids");
        return service.getProductDTOsByIds(ids);
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

    @LogActivity(actionType = "DELETE", entityType = "PRODUCT", description = "Deleted product", severityLevel = "HIGH", entityIdParam = "id")
    @PutMapping("/delete/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable Long id){
        service.deleteProduct(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Delete Product successfully.");
        return ResponseEntity.ok(response);
    }

    @LogActivity(actionType = "UPDATE", entityType = "PRODUCT", description = "Activated product", severityLevel = "MEDIUM", entityIdParam = "id")
    @PutMapping("/active/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> activeProduct(@PathVariable Long id){
        service.activeProduct(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Active product successfully.");
        return ResponseEntity.ok(response);
    }

    @LogActivity(actionType = "UPDATE", entityType = "PRODUCT", description = "Deactivated product", severityLevel = "MEDIUM", entityIdParam = "id")
    @PutMapping("/inactive/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> inactiveProduct(@PathVariable Long id){
        service.inactiveProduct(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Inactive Product successfully.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/adminProductDetail/{id}")
    public ProductDTO getProductDetail(@PathVariable Long id) {
        return service.getProductDetailById(id);
    }

    @GetMapping("/productquantity/{id}")
    public ResponseEntity<?> getProductQuantity(@PathVariable("id") Long productId) {
        Long quantity = service.getProductQuantity(productId);
        return ResponseEntity.ok(quantity);
    }

    @GetMapping("/variantstock/{id}")
    public ResponseEntity<?> getProductVariantStock(@PathVariable("id") Long variantId) {
        Integer stock = service.getProductVariantStock(variantId);
        return ResponseEntity.ok(stock);
    }

    @GetMapping("/latest")
    public ResponseEntity<List<Product>> getLatestProducts() {
        return ResponseEntity.ok(service.getLatest4Products());
    }

    @GetMapping("/topordered")
    public ResponseEntity<List<Product>> getTopOrderedProducts() {
        return ResponseEntity.ok(service.getTop4OrderedProducts());
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductDTO>> searchProducts(@RequestParam String keyword) {
        List<ProductDTO> results = service.searchProducts(keyword);
        return ResponseEntity.ok(results);
    }

}
