package com.Ojt.Ecommerce.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.Ojt.Ecommerce.annotations.LogActivity;
import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;
import com.Ojt.Ecommerce.annotations.RequiresPermission;
import static com.Ojt.Ecommerce.constants.PermissionConstants.PRODUCTS_CREATE;
import static com.Ojt.Ecommerce.constants.PermissionConstants.PRODUCTS_DELETE;
import static com.Ojt.Ecommerce.constants.PermissionConstants.PRODUCTS_UPDATE;
import static com.Ojt.Ecommerce.constants.PermissionConstants.PRODUCTS_VIEW;
import com.Ojt.Ecommerce.dto.ProductDTO;
import com.Ojt.Ecommerce.dto.TrendingProductDTO;
import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.service.ProductService;

import jakarta.transaction.Transactional;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/product")
@PermissionCategoryTag(value = "products", name = "Product Management", icon = "fa-box")
public class ProductController {
    @Autowired
    private ProductService service;

    @LogActivity(actionType = "CREATE", entityType = "PRODUCT", description = "Created product", severityLevel = "MEDIUM")
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequiresPermission(value = PRODUCTS_CREATE, level = "advanced")
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
    @RequiresPermission(value = PRODUCTS_VIEW, level = "basic")
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

    @LogActivity(actionType = "DELETE", entityType = "PRODUCT", description = "", severityLevel = "HIGH", entityIdParam = "id")
    @PutMapping("/delete/{id}")
    @Transactional
    @RequiresPermission(value = PRODUCTS_DELETE, level = "advanced")
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable Long id){
        service.deleteProduct(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Delete Product successfully.");
        return ResponseEntity.ok(response);
    }

    @LogActivity(actionType = "UPDATE", entityType = "PRODUCT", description = "Activated product", severityLevel = "MEDIUM", entityIdParam = "id", logChanges = true)
    @PutMapping("/active/{id}")
    @Transactional
    @RequiresPermission(value = PRODUCTS_UPDATE, level = "advanced")
    public ResponseEntity<Map<String, Object>> activeProduct(@PathVariable Long id){
        service.activeProduct(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Active product successfully.");
        return ResponseEntity.ok(response);
    }

    @LogActivity(actionType = "UPDATE", entityType = "PRODUCT", description = "Deactivated product", severityLevel = "MEDIUM", entityIdParam = "id", logChanges = true)
    @PutMapping("/inactive/{id}")
    @Transactional
    @RequiresPermission(value = PRODUCTS_UPDATE, level = "advanced")
    public ResponseEntity<Map<String, Object>> inactiveProduct(@PathVariable Long id){
        service.inactiveProduct(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Inactive Product successfully.");
        return ResponseEntity.ok(response);
    }

    @LogActivity(actionType = "UPDATE", entityType = "PRODUCT", description = "Updated product", severityLevel = "MEDIUM", entityIdParam = "id", logChanges = true)
    @PutMapping(value = "/update/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequiresPermission(value = PRODUCTS_UPDATE, level = "advanced")
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @RequestPart("product") ProductDTO dto,
            @RequestPart(value = "images", required = false) MultipartFile[] images,
            @RequestParam MultiValueMap<String, MultipartFile> fileMap) throws IOException {

        Map<String, List<MultipartFile>> variantImageMap = new HashMap<>();
        for (Map.Entry<String, List<MultipartFile>> entry : fileMap.entrySet()) {
            String key = entry.getKey();
            if (key.startsWith("variantImages_")) {
                variantImageMap.put(key, entry.getValue());
            }
        }

        Product updatedProduct = service.updateProductWithImages(id, dto, images, variantImageMap);

        if (updatedProduct == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to update product"));
        }

        return ResponseEntity.ok(updatedProduct);
    }

    @GetMapping("/adminProductDetail/{id}")
    public ProductDTO getProductDetail(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        return service.getProductDetailById(id, userId);
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
        return ResponseEntity.ok(service.getTop5OrderedProducts());
    }

    @GetMapping("/trending")
    public ResponseEntity<List<TrendingProductDTO>> getTrendingProducts() {
        return ResponseEntity.ok(service.getTrendingProductsWithReviews());
    }

    @GetMapping("/featured")
    public ResponseEntity<List<TrendingProductDTO>> getFeaturedProducts(@RequestParam(required = false) Long userId) {
        try {
            System.out.println("=== Featured Products Request ===");
            System.out.println("User ID: " + userId);
            List<TrendingProductDTO> featuredProducts = service.getPersonalizedFeaturedProducts(userId);
            System.out.println("Returning " + featuredProducts.size() + " featured products");
            
            // Debug: Check how many have discounts
            long productsWithDiscounts = featuredProducts.stream().filter(p -> p.getHasDiscount()).count();
            System.out.println("Products with discounts: " + productsWithDiscounts + "/" + featuredProducts.size());
            
            return ResponseEntity.ok(featuredProducts);
        } catch (Exception e) {
            System.err.println("Error in getFeaturedProducts: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductDTO>> searchProducts(@RequestParam String keyword) {
        List<ProductDTO> results = service.searchProducts(keyword);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/search-comprehensive")
    public ResponseEntity<List<ProductDTO>> searchProductsComprehensive(@RequestParam String keyword) {
        List<ProductDTO> results = service.searchProductsComprehensive(keyword);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/live-search")
    public ResponseEntity<List<ProductDTO>> liveSearch(@RequestParam String keyword) {
        List<ProductDTO> results = service.liveSearch(keyword);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/related")
    public ResponseEntity<List<ProductDTO>> getRelatedProducts(
            @RequestParam(required = false) List<Long> categoryIds,
            @RequestParam(required = false) List<Long> brandIds,
            @RequestParam Long currentProductId,
            @RequestParam(required = false) List<Long> excludeProductIds) {
        List<ProductDTO> products = service.getRelatedProducts(categoryIds, brandIds, currentProductId, excludeProductIds);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/report/with-variants")
    public ResponseEntity<List<Map<String, Object>>> getProductReportWithVariants() {
        return ResponseEntity.ok(service.getProductReportWithVariants());
    }

}
