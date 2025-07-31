package com.Ojt.Ecommerce.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Collections;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.Ojt.Ecommerce.dto.CategoryBrandPair;
import com.Ojt.Ecommerce.dto.ProductDTO;
import com.Ojt.Ecommerce.dto.ProductImageDTO;
import com.Ojt.Ecommerce.dto.VariantAttributeDTO;
import com.Ojt.Ecommerce.dto.VariantDTO;
import com.Ojt.Ecommerce.dto.TrendingProductDTO;
import com.Ojt.Ecommerce.entity.AttributeValue;
import com.Ojt.Ecommerce.entity.Brand;
import com.Ojt.Ecommerce.entity.Category;
import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.entity.ProductHasCategory;
import com.Ojt.Ecommerce.entity.EventProduct;
import com.Ojt.Ecommerce.entity.Events;
import com.Ojt.Ecommerce.entity.ProductDiscount;
import com.Ojt.Ecommerce.entity.Discount;
import com.Ojt.Ecommerce.entity.ProductImage;
import com.Ojt.Ecommerce.entity.ProductVariant;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.entity.VariantAttributeValue;
import com.Ojt.Ecommerce.entity.Review;
import com.Ojt.Ecommerce.entity.DiscountRule;
import com.Ojt.Ecommerce.repository.AttributeValueRepository;
import com.Ojt.Ecommerce.repository.BrandRepository;
import com.Ojt.Ecommerce.repository.CategoryRepository;
import com.Ojt.Ecommerce.repository.ProductHasCategoryRepository;
import com.Ojt.Ecommerce.repository.ProductImageRepository;
import com.Ojt.Ecommerce.repository.ProductRepository;
import com.Ojt.Ecommerce.repository.ProductVariantRepository;
import com.Ojt.Ecommerce.repository.ReviewRepository;
import com.Ojt.Ecommerce.repository.VariantAttributeValueRepository;
import com.Ojt.Ecommerce.repository.EventProductRepository;
import com.Ojt.Ecommerce.repository.DiscountRuleRepository;
import com.Ojt.Ecommerce.repository.DiscountRepository;
import com.Ojt.Ecommerce.util.ProductCodeGeneratorUtil;
import com.Ojt.Ecommerce.service.EmailService;
import com.Ojt.Ecommerce.service.UserService;

@Service
public class ProductService {
    private final Path uploadPath = Paths.get("product_image").toAbsolutePath();

    @Autowired
    private ProductRepository proRepo;

    @Autowired
    private CategoryRepository cateRepo;

    @Autowired
    private BrandRepository brandRepo;

    @Autowired
    private ModelMapper mapper;

    @Autowired
    private ProductVariantRepository variantRepo;

    @Autowired
    private VariantAttributeValueRepository variantAttributeValueRepo;

    @Autowired
    private AttributeValueRepository attrValueRepo;

    @Autowired
    private ProductImageRepository productImageRepo;

    @Autowired
    private ProductHasCategoryRepository productHasCategoryRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserService userService;

    @Autowired
    private ReviewRepository reviewRepo;

    @Autowired
    private EventProductRepository eventProductRepo;

    @Autowired
    private DiscountRuleRepository discountRuleRepo;

    @Autowired
    private DiscountRepository discountRepo;

    @Transactional
//    public Product saveProductWithImages(ProductDTO dto, MultipartFile[] files,Map<String, List<MultipartFile>> variantImageMap) throws IOException {
//        String code;
//        do {
//            code = ProductCodeGeneratorUtil.generateRandomProductCode();
//        } while (proRepo.existsByProductCode(code));
//
//        Product product = Product.builder()
//                .productName(dto.getProductName())
//                .price(dto.getPrice())
//                .quantity(dto.getQuantity())
//                .description(dto.getDescription())
//                .productCode(code)
//                .createDate(LocalDateTime.now())
//                .build();
//
//        Product savedProduct = proRepo.save(product);
//
//        Brand selectedBrand = null;
//        if (dto.getCategoryBrandPairs() != null) {
//            for (CategoryBrandPair pair : dto.getCategoryBrandPairs()) {
//                if (pair.getBrandId() != null) {
//                    selectedBrand = brandRepo.findById(pair.getBrandId()).orElse(null);
//                    break;
//                }
//            }
//        }
//        if (selectedBrand != null) {
//            savedProduct.setBrand(selectedBrand);
//        }
//
//// 👇 Save again after setting brand
//        savedProduct = proRepo.save(savedProduct);
//
//        Set<ProductHasCategory> phcList = new HashSet<>();//fix list to set 15.6.25
//
//        if (dto.getCategoryBrandPairs() != null) {
//            for (CategoryBrandPair pair : dto.getCategoryBrandPairs()) {
//                Category category = cateRepo.findById(pair.getCategoryId()).orElse(null);
//
//                // Only try to get brand if brandId is not null
//                Brand brand = null;
//                if (pair.getBrandId() != null) {
//                    brand = brandRepo.findById(pair.getBrandId()).orElse(null);
//                }
//
//                if (category != null) {
//                    ProductHasCategory phc = ProductHasCategory.builder()
//                            .product(savedProduct)
//                            .category(category)
//                            .brand(brand) // this will be null if not selected
//                            .build();
//                    phcList.add(phc);
//                }
//            }
//        }
//
//        savedProduct.setProductCategories(phcList);
//
//        if (!Files.exists(uploadPath)) {
//            Files.createDirectories(uploadPath);
//        }
//
//        List<ProductImage> imageList = new ArrayList<>();
//        for (MultipartFile file : files) {
//            if (!file.isEmpty()) {
//                String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
//                Path filePath = uploadPath.resolve(fileName);
//                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
//
//                ProductImage image = ProductImage.builder()
//                        .imageUrl("/product_image/" + fileName)
//                        .product(savedProduct)
//                        .status(1)
//                        .build();
//
//                imageList.add(image);
//            }
//        }
//
//        savedProduct.setProductImages(imageList);
//
//        int variantImageIndex = 0;
////        if (dto.getHasVariant() != null && dto.getHasVariant()) {
////            // 1. Save each variant
////            for (VariantDTO variantDTO : dto.getVariants()) {
////                ProductVariant variant = ProductVariant.builder()
////                        .price(BigDecimal.valueOf(variantDTO.getPrice()))
////                        .stock(variantDTO.getStock())
////                        .stockKeeping(variantDTO.getSku())
////                        .product(savedProduct)
////                        .build();
////
////                variant = variantRepo.save(variant);
////
////                // 2. Save each variant's attribute-value mapping
////                for (VariantAttributeDTO attr : variantDTO.getAttributes()) {
////                    Long attrId = attr.getAttributeId();
////                    Long valueId = attr.getValueId();
////
////                    AttributeValue attrValue = attrValueRepo.findById(valueId).orElse(null);
////                    if (attrValue != null) {
////                        VariantAttributeValue vav = VariantAttributeValue.builder()
////                                .attributeValue(attrValue)
////                                .productVariant(variant)
////                                .build();
////                        variantAttributeValueRepo.save(vav);
////                    }
////                }
////
////                if (variantImages != null && variantImageIndex < variantImages.length) {
////                    MultipartFile variantImageFile = variantImages[variantImageIndex];
////                    if (!variantImageFile.isEmpty()) {
////                        String fileName = UUID.randomUUID() + "_" + variantImageFile.getOriginalFilename();
////                        Path filePath = uploadPath.resolve(fileName);
////                        Files.copy(variantImageFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
////
////                        ProductImage variantImage = ProductImage.builder()
////                                .imageUrl("/product_image/" + fileName)
////                                .product(savedProduct)
////                                .productVariant(variant)
////                                .status(1)
////                                .build();
////                        productImageRepo.save(variantImage);
////                    }
////                    variantImageIndex++;
////                }
////
////            }
////        }
//
//        if (dto.getHasVariant() != null && dto.getHasVariant()) {
//            // ✅ FIXED: Use index-based loop so we have access to `i`
//            for (int i = 0; i < dto.getVariants().size(); i++) {
//                VariantDTO variantDTO = dto.getVariants().get(i);
//
//                ProductVariant variant = ProductVariant.builder()
//                        .price(BigDecimal.valueOf(variantDTO.getPrice()))
//                        .stock(variantDTO.getStock())
//                        .stockKeeping(variantDTO.getSku())
//                        .product(savedProduct)
//                        .build();
//
//                variant = variantRepo.save(variant);
//
//                // 2. Save variant's attribute-value mapping
//                for (VariantAttributeDTO attr : variantDTO.getAttributes()) {
//                    Long attrId = attr.getAttributeId();
//                    Long valueId = attr.getValueId();
//
//                    AttributeValue attrValue = attrValueRepo.findById(valueId).orElse(null);
//                    if (attrValue != null) {
//                        VariantAttributeValue vav = VariantAttributeValue.builder()
//                                .attributeValue(attrValue)
//                                .productVariant(variant)
//                                .build();
//                        variantAttributeValueRepo.save(vav);
//                    }
//                }
//
//                // ✅ Handle variant images per index
//                List<MultipartFile> imagesForVariant = variantImageMap.get("variantImages_" + i);
//                if (imagesForVariant != null && !imagesForVariant.isEmpty()) {
//                    for (MultipartFile variantImageFile : imagesForVariant) {
//                        if (!variantImageFile.isEmpty()) {
//                            String fileName = UUID.randomUUID() + "_" + variantImageFile.getOriginalFilename();
//                            Path filePath = uploadPath.resolve(fileName);
//                            Files.copy(variantImageFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
//
//                            ProductImage variantImage = ProductImage.builder()
//                                    .imageUrl("/product_image/" + fileName)
//                                    .product(savedProduct)
//                                    .productVariant(variant)
//                                    .status(1)
//                                    .build();
//                            productImageRepo.save(variantImage);
//                        }
//                    }
//                }
//
//            }
//        }
//
//
//
//        return proRepo.save(savedProduct);
//    }

    public Product saveProductWithImages(ProductDTO dto, MultipartFile[] files, Map<String, List<MultipartFile>> variantImageMap) throws IOException {
        // 1. Generate unique product code
        String code;
        do {
            code = ProductCodeGeneratorUtil.generateRandomProductCode();
        } while (proRepo.existsByProductCode(code));

        // 2. Create base product without category-brand pairs yet
        Product product = Product.builder()
                .productName(dto.getProductName())
                .price(dto.getPrice())
                .quantity(dto.getQuantity())
                .description(dto.getDescription())
                .productCode(code)
                .createDate(LocalDateTime.now())
                .build();

        Product savedProduct = proRepo.save(product);

        // 3. Assign main brand for product (optional)
        Brand selectedBrand = dto.getCategoryBrandPairs().stream()
                .map(CategoryBrandPair::getBrandId)
                .filter(Objects::nonNull)
                .map(brandId -> brandRepo.findById(brandId).orElse(null))
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);

        savedProduct.setBrand(selectedBrand);
        savedProduct = proRepo.save(savedProduct);

        // 4. Save all category-brand pairs
        for (CategoryBrandPair pair : dto.getCategoryBrandPairs()) {
            Category category = cateRepo.findById(pair.getCategoryId()).orElse(null);
            Brand brand = (pair.getBrandId() != null) ? brandRepo.findById(pair.getBrandId()).orElse(null) : null;

            if (category != null) {
                ProductHasCategory phc = ProductHasCategory.builder()
                        .product(savedProduct)
                        .category(category)
                        .brand(brand)
                        .build();

                productHasCategoryRepository.save(phc); // ✅ This saves each pair explicitly
            }
        }

        savedProduct = proRepo.save(savedProduct);

        // 5. Save product images
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        List<ProductImage> imageList = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                ProductImage image = ProductImage.builder()
                        .imageUrl("/product_image/" + fileName)
                        .product(savedProduct)
                        .status(1)
                        .build();

                imageList.add(image);
            }
        }
        savedProduct.setProductImages(imageList);

        // 6. Save product variants and variant images
        if (dto.getHasVariant() != null && dto.getHasVariant()) {
            for (int i = 0; i < dto.getVariants().size(); i++) {
                VariantDTO variantDTO = dto.getVariants().get(i);

                ProductVariant variant = ProductVariant.builder()
                        .price(BigDecimal.valueOf(variantDTO.getPrice()))
                        .stock(variantDTO.getStock())
                        .stockKeeping(variantDTO.getSku()) // Always set SKU from frontend
                        .product(savedProduct)
                        .status(1)
                        .build();
                variant = variantRepo.save(variant);

                // Save variant attribute-value mappings
                for (VariantAttributeDTO attr : variantDTO.getAttributes()) {
                    AttributeValue attrValue = attrValueRepo.findById(attr.getValueId()).orElse(null);
                    if (attrValue != null) {
                        VariantAttributeValue vav = VariantAttributeValue.builder()
                                .attributeValue(attrValue)
                                .productVariant(variant)
                                .build();
                        variantAttributeValueRepo.save(vav);
                    }
                }

                // Save variant images
                List<MultipartFile> variantImages = variantImageMap.get("variantImages_" + i);
                if (variantImages != null) {
                    for (MultipartFile imageFile : variantImages) {
                        if (!imageFile.isEmpty()) {
                            String fileName = UUID.randomUUID() + "_" + imageFile.getOriginalFilename();
                            Path filePath = uploadPath.resolve(fileName);
                            Files.copy(imageFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                            ProductImage variantImage = ProductImage.builder()
                                    .imageUrl("/product_image/" + fileName)
                                    .product(savedProduct)
                                    .productVariant(variant)
                                    .status(1)
                                    .build();
                            productImageRepo.save(variantImage);
                        }
                    }
                }
            }
        }


        // 7. Return saved product
        Product finalSavedProduct = proRepo.save(savedProduct);

        // --- EMAIL NOTIFICATION LOGIC ---
        String productName = finalSavedProduct.getProductName();
        String date = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
        String subject = "Introducing Our New Arrival: " + productName;
        String mainImageUrl = null;
        String mainImagePath = null;
        if (finalSavedProduct.getProductImages() != null && !finalSavedProduct.getProductImages().isEmpty()) {
            // Use the first image as the main image
            mainImageUrl = finalSavedProduct.getProductImages().get(0).getImageUrl();
            // Convert URL to file system path (assuming /product_image/ maps to product_image/ folder)
            if (mainImageUrl != null && mainImageUrl.startsWith("/product_image/")) {
                mainImagePath = Paths.get("product_image", mainImageUrl.substring("/product_image/".length())).toAbsolutePath().toString();
            }
        }
        String imageCid = "productImage001";
        String htmlBody = String.format(
                "<div style='font-family:Arial, sans-serif; line-height:1.6; color:#333;'>"
                        + "<h2 style='color:#2c3e50;'>🎉 New Product Just Dropped!</h2>"
                        + "<p>We’re thrilled to introduce a brand-new addition to our collection:</p>"
                        + "<h3 style='color:#34495e;'>%s</h3>"
                        + (mainImageUrl != null
                        ? "<img src='cid:" + imageCid + "' alt='Product Image' style='max-width:100%%; height:auto; border-radius:8px; margin:16px 0;'/>"
                        : "")
                        + "<p><b>Available Starting:</b> %s</p>"
                        + "<p>Be among the first to check it out and grab yours today!</p>"
                        + "<p style='margin-top:32px;'>Warm regards,<br/>The Britium Gallery Team</p>"
                        + "</div>",
                productName, date
        );
        String plainBody = String.format(
                "🎉 New Product Alert!\n\n"
                        + "We're excited to introduce a new item in our store:\n\n"
                        + "Product: %s\n"
                        + "Available Starting: %s\n\n"
                        + "Be among the first to check it out!\n\n"
                        + "Warm regards,\n"
                        + "The Britium Gallery Team",
                productName, date
        );
        for (User user : userService.getAllUsers()) {
            if (user.getEmail() != null && user.isVerified()) {
                try {
                    if (mainImagePath != null) {
                        emailService.sendHtmlEmailWithImage(user.getEmail(), subject, htmlBody, mainImagePath, imageCid);
                    } else {
                        emailService.sendEmail(user.getEmail(), subject, plainBody);
                    }
                } catch (Exception e) {
                    // Fallback to plain text if HTML fails
                    emailService.sendEmail(user.getEmail(), subject, plainBody);
                }
            }
        }
        return finalSavedProduct;
    }

    @Transactional
    public Product updateProductWithImages(
            Long productId,
            ProductDTO dto,
            MultipartFile[] files,
            Map<String, List<MultipartFile>> variantImageMap) throws IOException {

        Product product = proRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // 1. Update basic product fields
        product.setProductName(dto.getProductName());
        product.setPrice(dto.getPrice());
        product.setQuantity(dto.getQuantity());
        product.setDescription(dto.getDescription());
        product.setUpdateDate(LocalDateTime.now());
        product.setStatus(Math.toIntExact(dto.getStatus()));

        // 2. Set brand from category-brand pair (optional)
        Brand selectedBrand = dto.getCategoryBrandPairs().stream()
                .map(CategoryBrandPair::getBrandId)
                .filter(Objects::nonNull)
                .map(brandId -> brandRepo.findById(brandId).orElse(null))
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
        product.setBrand(selectedBrand);

        // 3. Update category-brand pairs
        productHasCategoryRepository.deleteAll(product.getProductCategories());
        product.getProductCategories().clear(); // <-- clear the set after deletion

        Set<ProductHasCategory> newPhcSet = new HashSet<>();
        for (CategoryBrandPair pair : dto.getCategoryBrandPairs()) {
            Category category = cateRepo.findById(pair.getCategoryId()).orElse(null);
            Brand brand = (pair.getBrandId() != null) ? brandRepo.findById(pair.getBrandId()).orElse(null) : null;
            if (category != null) {
                ProductHasCategory phc = ProductHasCategory.builder()
                        .product(product)
                        .category(category)
                        .brand(brand)
                        .build();
                newPhcSet.add(phc);
                productHasCategoryRepository.save(phc);
            }
        }
        // Instead of setProductCategories, mutate the existing set
        product.getProductCategories().addAll(newPhcSet);

        // 4. Handle product images (delete only those marked for deletion, not all)
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        // Delete only images marked for deletion
        if (dto.getImagesMarkedForDeletion() != null && !dto.getImagesMarkedForDeletion().isEmpty()) {
            List<ProductImage> toDelete = product.getProductImages().stream()
                .filter(img -> img.getProductVariant() == null && dto.getImagesMarkedForDeletion().contains(img.getId()))
                .collect(Collectors.toList());
            productImageRepo.deleteAll(toDelete);
            // Remove from product.getProductImages() using a new list to avoid lambda finality issue
            List<ProductImage> toRemove = product.getProductImages().stream()
                .filter(img -> img.getProductVariant() == null && dto.getImagesMarkedForDeletion().contains(img.getId()))
                .collect(Collectors.toList());
            product.getProductImages().removeAll(toRemove);
        }
        // Add new product images
        if (files != null && files.length > 0) {
            List<ProductImage> imageList = new ArrayList<>();
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
                    Path filePath = uploadPath.resolve(fileName);
                    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                    ProductImage image = ProductImage.builder()
                            .imageUrl("/product_image/" + fileName)
                            .product(product)
                            .status(1)
                            .build();
                    imageList.add(image);
                }
            }
            product.getProductImages().addAll(imageList);
        }

        // 5. Handle variants: insert/update + soft-delete removed ones
        if (Boolean.TRUE.equals(dto.getHasVariant())) {
            List<ProductVariant> existingVariants = product.getProductVariants() != null ? product.getProductVariants() : new ArrayList<>();
            Map<String, ProductVariant> existingMap = existingVariants.stream()
                    .collect(Collectors.toMap(ProductVariant::getStockKeeping, v -> v));

            List<ProductVariant> updatedVariants = new ArrayList<>();
            Set<String> incomingSkus = new HashSet<>();

            // First, create and save all new/updated variants, setting the product reference
            for (int i = 0; i < dto.getVariants().size(); i++) {
                VariantDTO variantDTO = dto.getVariants().get(i);
                String sku = variantDTO.getSku();
                incomingSkus.add(sku);

                ProductVariant variant = existingMap.get(sku);
                if (variant == null) {
                    // New variant
                    variant = ProductVariant.builder()
                            .product(product)
                            .stockKeeping(sku)
                            .price(BigDecimal.valueOf(variantDTO.getPrice()))
                            .stock(variantDTO.getStock())
                            .status(1)
                            .build();
                } else {
                    // Existing variant → update
                    variant.setStockKeeping(sku); // <-- Always update SKU!
                    variant.setPrice(BigDecimal.valueOf(variantDTO.getPrice()));
                    variant.setStock(variantDTO.getStock());
                    variant.setStatus(1);
                }
                variant.setProduct(product); // Ensure the product reference is set
                variant = variantRepo.save(variant);
                updatedVariants.add(variant);
            }

            // Now, for each variant, update attribute values and images
            for (int i = 0; i < dto.getVariants().size(); i++) {
                VariantDTO variantDTO = dto.getVariants().get(i);
                String sku = variantDTO.getSku();
                ProductVariant variant = updatedVariants.stream().filter(v -> v.getStockKeeping().equals(sku)).findFirst().orElse(null);
                if (variant == null) continue;

                // Update attribute values using a controlled approach to avoid JPA conflicts
                List<VariantAttributeValue> existingVavs = variantAttributeValueRepo.findByProductVariant(variant);
                
                // Create a set of incoming attribute value IDs
                Set<Long> incomingValueIds = variantDTO.getAttributes().stream()
                        .map(VariantAttributeDTO::getValueId)
                        .collect(Collectors.toSet());
                
                // Delete only the attribute values that are no longer present
                for (VariantAttributeValue existingVav : existingVavs) {
                    if (!incomingValueIds.contains(existingVav.getAttributeValue().getId())) {
                        variantAttributeValueRepo.delete(existingVav);
                    }
                }
                
                // Add only new attribute values that don't already exist
                Set<Long> existingValueIds = existingVavs.stream()
                        .map(vav -> vav.getAttributeValue().getId())
                        .collect(Collectors.toSet());
                
                for (VariantAttributeDTO attr : variantDTO.getAttributes()) {
                    if (!existingValueIds.contains(attr.getValueId())) {
                        AttributeValue attrValue = attrValueRepo.findById(attr.getValueId()).orElse(null);
                        if (attrValue != null) {
                            VariantAttributeValue vav = VariantAttributeValue.builder()
                                    .productVariant(variant)
                                    .attributeValue(attrValue)
                                    .build();
                            variantAttributeValueRepo.save(vav);
                        }
                    }
                }

                // Handle variant images: delete only those marked for deletion
                if (dto.getVariantImagesMarkedForDeletion() != null && dto.getVariantImagesMarkedForDeletion().containsKey(String.valueOf(i))) {
                    List<Long> idsToDelete = dto.getVariantImagesMarkedForDeletion().get(String.valueOf(i));
                    if (idsToDelete != null && !idsToDelete.isEmpty()) {
                        List<ProductImage> toDelete = productImageRepo.findByProductVariant(variant).stream()
                            .filter(img -> idsToDelete.contains(img.getId()))
                            .collect(Collectors.toList());
                        productImageRepo.deleteAll(toDelete);
                        List<ProductImage> toRemove = new ArrayList<>();
                        for (ProductImage img : product.getProductImages()) {
                            if (img.getProductVariant() != null && img.getProductVariant().getId().equals(variant.getId()) && idsToDelete.contains(img.getId())) {
                                toRemove.add(img);
                            }
                        }
                        product.getProductImages().removeAll(toRemove);
                    }
                }
                // Add new variant images
                List<MultipartFile> variantImages = variantImageMap.get("variantImages_" + i);
                if (variantImages != null) {
                    for (MultipartFile imageFile : variantImages) {
                        if (!imageFile.isEmpty()) {
                            String fileName = UUID.randomUUID() + "_" + imageFile.getOriginalFilename();
                            Path filePath = uploadPath.resolve(fileName);
                            Files.copy(imageFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                            ProductImage variantImage = ProductImage.builder()
                                    .imageUrl("/product_image/" + fileName)
                                    .product(product)
                                    .productVariant(variant)
                                    .status(1)
                                    .build();
                            productImageRepo.save(variantImage);
                        }
                    }
                }
            }

            // Soft-delete missing variants
            for (ProductVariant existing : existingVariants) {
                if (!incomingSkus.contains(existing.getStockKeeping())) {
                    existing.setStatus(0);
                    variantRepo.save(existing);
                }
            }

            // Clear existing variants and add updated ones to avoid duplication
            product.getProductVariants().clear();
            product.getProductVariants().addAll(updatedVariants);
        }

        // Save product
        return proRepo.save(product);
    }

//    public List<Product> getAllProduct(){
//        return proRepo.findAllProduct();
//    }

//    public List<ProductDTO> getAllActiveProductDTOs() {
//        List<Product> products = proRepo.getAllActiveProduct();
//        return products.stream()
//                .map(this::convertToDTO)
//                .collect(Collectors.toList());
//    }
//
//    private ProductDTO convertToDTO(Product product) {
//        ProductDTO dto = mapper.map(product, ProductDTO.class);

    @Transactional(readOnly = true)
    public List<ProductDTO> getAllProduct() {
        List<Product> products = proRepo.findAllProduct();
        return products.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    //test fixing for error 15.6.25
    public List<ProductDTO> getAllActiveProductDTOs() {
        List<Product> products = proRepo.getAllActiveProduct();
        return products.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ProductDTO> getProductDTOsByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return new ArrayList<>();
        List<Product> products = proRepo.findByIdIn(ids);
        return products.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<ProductDTO> getRelatedProducts(List<Long> categoryIds, List<Long> brandIds, Long currentProductId, List<Long> excludeProductIds) {
        // Ensure we have valid lists
        categoryIds = categoryIds != null ? categoryIds : new ArrayList<>();
        brandIds = brandIds != null ? brandIds : new ArrayList<>();
        excludeProductIds = excludeProductIds != null ? excludeProductIds : new ArrayList<>();
        
        // If excludeProductIds is empty, add a dummy value to avoid SQL issues
        if (excludeProductIds.isEmpty()) {
            excludeProductIds.add(-1L); // Use -1 as a dummy ID that won't exist
        }
        
        // Add current product to exclude list
        if (currentProductId != null) {
            excludeProductIds.add(currentProductId);
        }
        
        // Check if we have any category or brand IDs to search by
        if (categoryIds.isEmpty() && brandIds.isEmpty()) {
            System.out.println("No category or brand IDs provided for related products search");
            return new ArrayList<>();
        }
        
        System.out.println("Searching related products with categoryIds: " + categoryIds + ", brandIds: " + brandIds);
        System.out.println("Excluding product IDs: " + excludeProductIds);
        
        try {
            List<Product> products = proRepo.findRelatedProducts(categoryIds, brandIds, excludeProductIds);
            
            System.out.println("Found " + products.size() + " related products");
            
            // Limit to 5 products and convert to DTOs
            return products.stream()
                    .limit(5)
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error finding related products: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    private ProductDTO convertToDTO(Product product) {
        ProductDTO dto = mapper.map(product, ProductDTO.class);

        // Manually map images to avoid PersistentBag issues
        if (product.getProductImages() != null) {
            dto.setProductImages(
                    product.getProductImages().stream()
                            .map(image -> new ProductImageDTO(
                                    image.getId(),
                                    image.getImageUrl(),
                                    image.getStatus(),
                                    image.getProductVariant() != null ? (image.getProductVariant().getId() != null ? image.getProductVariant().getId().longValue() : null) : null
                            ))
                            .collect(Collectors.toList())
            );
        }

        // Map category-brand pairs
        List<CategoryBrandPair> pairs = product.getProductCategories().stream()
                .map(pc -> new CategoryBrandPair(
                        pc.getCategory().getId(),
                        pc.getCategory().getName(),
                        pc.getBrand() != null ? pc.getBrand().getId() : null,
                        pc.getBrand() != null ? pc.getBrand().getName() : null
                ))
                .collect(Collectors.toList());
        dto.setCategoryBrandPairs(pairs);

        List<VariantDTO> variantDTOs = product.getProductVariants().stream()
                .map(variant -> {
                    VariantDTO vdto = new VariantDTO();
                    vdto.setId(variant.getId());
                    vdto.setName(variant.getStockKeeping());
                    vdto.setSku(variant.getStockKeeping());
                    vdto.setPrice(variant.getPrice() != null ? variant.getPrice().doubleValue() : 0.0);
                    vdto.setStock(variant.getStock() != null ? variant.getStock() : 0);

                    List<VariantAttributeDTO> attrDTOs = variant.getVariantAttributeValues().stream()
                            .map(vav -> {
                                VariantAttributeDTO vatd = new VariantAttributeDTO();
                                if (vav.getAttributeValue() != null) {
                                    AttributeValue av = vav.getAttributeValue();
                                    if (av.getAttribute() != null) {
                                        vatd.setAttributeId(av.getAttribute().getId());
                                        vatd.setAttributeName(av.getAttribute().getName());
                                    }
                                    vatd.setValueId(av.getId());
                                    vatd.setValue(av.getValue());
                                }
                                return vatd;
                            }).toList();

                    vdto.setAttributes(attrDTOs);

                    return vdto;
                }).toList();

        List<ProductImageDTO> images = product.getProductImages().stream()
                .map(img -> new ProductImageDTO(
                        img.getId(),
                        img.getImageUrl(),
                        img.getStatus(),
                        img.getProductVariant() != null ? (img.getProductVariant().getId() != null ? img.getProductVariant().getId().longValue() : null) : null
                ))
                .collect(Collectors.toList());
        dto.setProductImages(images);

        dto.setVariants(variantDTOs);
        dto.setHasVariant(!variantDTOs.isEmpty());

        // Calculate and set rating information
        List<Review> reviews = reviewRepo.findByProductIdOrderByTimestampDesc(product.getId());
        if (reviews != null && !reviews.isEmpty()) {
            double averageRating = reviews.stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(0.0);
            dto.setAverageRating(Math.round(averageRating * 10.0) / 10.0); // Round to 1 decimal place
            dto.setReviewCount(reviews.size());
        } else {
            dto.setAverageRating(0.0);
            dto.setReviewCount(0);
        }

        return dto;
    }

    @Transactional
    public void deleteProduct(Long id) {
        proRepo.deleteProduct(id);
    }

    @Transactional
    public void inactiveProduct(Long id) {
        proRepo.inactiveProduct(id);
    }

    @Transactional
    public void activeProduct(Long id) {
        proRepo.activeProduct(id);
    }

    public ProductDTO getProductDetailById(Long productId, Long userId) {
        Optional<Product> optionalProduct = proRepo.findById(productId);
        if (optionalProduct.isEmpty()) return null;

        Product product = optionalProduct.get();

        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setProductName(product.getProductName());
        dto.setProductCode(product.getProductCode());
        dto.setPrice(product.getPrice() != null ? product.getPrice() : 0.0);
        dto.setQuantity(product.getQuantity());
        dto.setDescription(product.getDescription());
        dto.setStatus(product.getStatus() != null ? product.getStatus().longValue() : null);

        // CategoryBrandPairs
        List<CategoryBrandPair> pairs = product.getProductCategories().stream()
                .map(pc -> new CategoryBrandPair(
                        pc.getCategory().getId(),
                        pc.getCategory().getName(),
                        pc.getBrand() != null ? pc.getBrand().getId() : null,
                        pc.getBrand() != null ? pc.getBrand().getName() : null
                ))
                .distinct()
                .toList();
        dto.setCategoryBrandPairs(pairs);

        // Product Images
        List<ProductImageDTO> imageDTOs = product.getProductImages().stream()
                .map(img -> {
                    ProductImageDTO pidto = new ProductImageDTO();
                    pidto.setId(img.getId());
                    pidto.setImageUrl(img.getImageUrl());
                    pidto.setStatus(img.getStatus());
                    pidto.setVariantId(img.getProductVariant() != null ? img.getProductVariant().getId().longValue() : null);
                    return pidto;
                }).toList();
        dto.setProductImages(imageDTOs);

        // Variants and their attributes
        List<VariantDTO> variantDTOs = product.getProductVariants().stream()
                .map(variant -> {
                    VariantDTO vdto = new VariantDTO();
                    vdto.setId(variant.getId());
                    vdto.setName(variant.getStockKeeping());
                    vdto.setSku(variant.getStockKeeping());
                    vdto.setPrice(variant.getPrice() != null ? variant.getPrice().doubleValue() : 0.0);
                    vdto.setStock(variant.getStock() != null ? variant.getStock() : 0);

                    List<VariantAttributeDTO> attrDTOs = variant.getVariantAttributeValues().stream()
                            .map(vav -> {
                                VariantAttributeDTO vatd = new VariantAttributeDTO();
                                if (vav.getAttributeValue() != null) {
                                    AttributeValue av = vav.getAttributeValue();
                                    if (av.getAttribute() != null) {
                                        vatd.setAttributeId(av.getAttribute().getId());
                                        vatd.setAttributeName(av.getAttribute().getName());
                                    }
                                    vatd.setValueId(av.getId());
                                    vatd.setValue(av.getValue());
                                }
                                return vatd;
                            }).toList();

                    vdto.setAttributes(attrDTOs);

                    return vdto;
                }).toList();

        dto.setVariants(variantDTOs);
        dto.setHasVariant(!variantDTOs.isEmpty());

        // Add discount information
        dto.setHasDiscount(hasActiveDiscount(product));
        if (hasActiveDiscount(product) && userId != null) {
            // Find the applicable discount for this user and product
            DiscountRule discountRule = discountRuleRepo.findActiveProductDiscountRule(productId, userId);
            if (discountRule != null) {
                Discount discount = discountRule.getDiscount();
                dto.setDiscountType(discount.getDiscountType().toString());
                dto.setDiscountValue(discount.getDiscountValue());
                dto.setDiscountName(discount.getName());
            }
        }

        return dto;
    }

    public Long getProductQuantity(Long productId) {
        return proRepo.findProductQuantity(productId);
    }

    public Integer getProductVariantStock(Long variantId) {
        return variantRepo.findProductVariant(variantId);
    }

    public List<Product> getLatest4Products() {
        return proRepo.findTop4ByOrderByCreateDateDesc().stream().limit(4).toList();
    }

    public List<Product> getTop5OrderedProducts() {
        return proRepo.findTop5OrderedProductsNative();
    }

    public List<TrendingProductDTO> getTrendingProductsWithReviews() {
        List<Product> topProducts = proRepo.findTop5OrderedProductsNative();
        return topProducts.stream().map(this::convertToTrendingDTO).collect(Collectors.toList());
    }

    public List<TrendingProductDTO> getPersonalizedFeaturedProducts(Long userId) {
        List<Product> featuredProducts;
        
        System.out.println("=== Getting Personalized Featured Products ===");
        System.out.println("User ID: " + userId);
        
        if (userId == null) {
            // For non-logged in users, get latest products by creation date
            List<Product> latestProducts = proRepo.findTop10ByOrderByCreateDateDesc();
            System.out.println("Latest products by creation date: " + latestProducts.size());
            
            // Check which of these latest products have discounts
            List<Product> productsWithDiscounts = latestProducts.stream()
                .filter(product -> hasActiveDiscount(product))
                    .collect(Collectors.toList());
                
            System.out.println("Latest products with discounts: " + productsWithDiscounts.size());
            
            // Take first 5 products (prioritizing by creation date, with discounts shown as badges)
            featuredProducts = latestProducts.stream()
                .limit(5)
                .collect(Collectors.toList());
                
            System.out.println("Final featured products (latest by creation date): " + featuredProducts.size());
        } else {
            // For logged-in users, still prioritize by creation date but consider user preferences
            List<Long> wishlistProductIds = getWishlistProductIds(userId);
            List<Long> orderProductIds = getOrderProductIds(userId);
            
            if (wishlistProductIds.isEmpty() && orderProductIds.isEmpty()) {
                // If user has no history, get latest products by creation date
                List<Product> latestProducts = proRepo.findTop10ByOrderByCreateDateDesc();
                featuredProducts = latestProducts.stream()
                    .limit(5)
                    .collect(Collectors.toList());
                System.out.println("User has no history, using latest products by creation date: " + featuredProducts.size());
                } else {
                // Get user's preferred categories and brands
                Set<Long> categoryIds = getCategoryIdsFromProducts(wishlistProductIds, orderProductIds);
                Set<Long> brandIds = getBrandIdsFromProducts(wishlistProductIds, orderProductIds);
                
                // Get products from user's preferred categories/brands, ordered by creation date
                List<Product> personalizedProducts = getProductsByCategoriesAndBrandsOrderedByDate(categoryIds, brandIds, 10);
                
                if (personalizedProducts.size() >= 5) {
                    featuredProducts = personalizedProducts.stream()
                        .limit(5)
                        .collect(Collectors.toList());
                } else {
                    // If not enough personalized products, fill with latest products
                    List<Product> latestProducts = proRepo.findTop10ByOrderByCreateDateDesc();
                    Set<Long> personalizedProductIds = personalizedProducts.stream()
                        .map(Product::getId)
                        .collect(Collectors.toSet());
                    
                    List<Product> additionalProducts = latestProducts.stream()
                        .filter(p -> !personalizedProductIds.contains(p.getId()))
                        .limit(5 - personalizedProducts.size())
                        .collect(Collectors.toList());
                    
                    featuredProducts = new ArrayList<>();
                    featuredProducts.addAll(personalizedProducts);
                    featuredProducts.addAll(additionalProducts);
                }
                
                System.out.println("Using personalized products ordered by creation date: " + featuredProducts.size());
            }
        }
        
        System.out.println("Final featured products count: " + featuredProducts.size());
        List<TrendingProductDTO> result = featuredProducts.stream().map(this::convertToTrendingDTO).collect(Collectors.toList());
        
        // Debug: Check how many have discounts in final result
        long productsWithDiscounts = result.stream().filter(p -> p.getHasDiscount()).count();
        System.out.println("Final result - products with discounts: " + productsWithDiscounts + "/" + result.size());
        
        return result;
    }

    private List<Long> getWishlistProductIds(Long userId) {
        // TODO: Implement wishlist repository call
        // For now, return empty list
        return new ArrayList<>();
    }

    private List<Long> getOrderProductIds(Long userId) {
        // TODO: Implement order repository call
        // For now, return empty list
        return new ArrayList<>();
    }

    private Set<Long> getCategoryIdsFromProducts(List<Long> productIds) {
        if (productIds.isEmpty()) return new HashSet<>();
        
        List<Product> products = proRepo.findAllById(productIds);
        Set<Long> categoryIds = new HashSet<>();
        
        for (Product product : products) {
            if (product.getProductCategories() != null) {
                for (ProductHasCategory phc : product.getProductCategories()) {
                    if (phc.getCategory() != null) {
                        categoryIds.add(phc.getCategory().getId());
                    }
                }
            }
        }
        
        return categoryIds;
    }

    private Set<Long> getBrandIdsFromProducts(List<Long> productIds) {
        if (productIds.isEmpty()) return new HashSet<>();
        
        List<Product> products = proRepo.findAllById(productIds);
        Set<Long> brandIds = new HashSet<>();
        
        for (Product product : products) {
            if (product.getBrand() != null) {
                brandIds.add(product.getBrand().getId());
            }
            if (product.getProductCategories() != null) {
                for (ProductHasCategory phc : product.getProductCategories()) {
                    if (phc.getBrand() != null) {
                        brandIds.add(phc.getBrand().getId());
                    }
                }
            }
        }
        
        return brandIds;
    }

    private Set<Long> getCategoryIdsFromProducts(List<Long> wishlistProductIds, List<Long> orderProductIds) {
        Set<Long> allCategoryIds = new HashSet<>();
        allCategoryIds.addAll(getCategoryIdsFromProducts(wishlistProductIds));
        allCategoryIds.addAll(getCategoryIdsFromProducts(orderProductIds));
        return allCategoryIds;
    }

    private Set<Long> getBrandIdsFromProducts(List<Long> wishlistProductIds, List<Long> orderProductIds) {
        Set<Long> allBrandIds = new HashSet<>();
        allBrandIds.addAll(getBrandIdsFromProducts(wishlistProductIds));
        allBrandIds.addAll(getBrandIdsFromProducts(orderProductIds));
        return allBrandIds;
    }

    private List<Product> getProductsWithActiveDiscounts(int limit) {
        LocalDate today = LocalDate.now();
        List<Product> productsWithDiscounts = new ArrayList<>();
        
        System.out.println("=== Getting Products with Active Discounts ===");
        System.out.println("Today's date: " + today);
        
        // Get all active products with their discounts
        List<Product> allProducts = proRepo.findAll().stream()
                .filter(p -> p.getStatus() != null && p.getStatus() == 1)
                .collect(Collectors.toList());
        System.out.println("Total active products found: " + allProducts.size());
        
        for (Product product : allProducts) {
            System.out.println("Checking product: " + product.getId() + " - " + product.getProductName());
            
            // Check for product-specific discount rules
            List<DiscountRule> productDiscountRules = discountRuleRepo.findByProductIdAndDiscountStatusTrue(product.getId());
            System.out.println("Product " + product.getId() + " has " + (productDiscountRules != null ? productDiscountRules.size() : 0) + " product discount rules");
            
            boolean hasActiveDiscount = false;
            
            // Check product-specific discounts
            if (productDiscountRules != null && !productDiscountRules.isEmpty()) {
                for (DiscountRule discountRule : productDiscountRules) {
                    Discount discount = discountRule.getDiscount();
                    System.out.println("Product Discount: " + (discount != null ? discount.getName() + " (status: " + discount.isStatus() + ")" : "null"));
                    
                    if (discount != null && discount.isStatus()) {
                        LocalDate startDate = discount.getStartDate();
                        LocalDate endDate = discount.getEndDate();
                        
                        System.out.println("Discount dates - Start: " + startDate + ", End: " + endDate);
                        
                        if (startDate != null && endDate != null && 
                            today.isAfter(startDate.minusDays(1)) && today.isBefore(endDate.plusDays(1))) {
                            System.out.println("✓ Found active product discount for product " + product.getId());
                            hasActiveDiscount = true;
                            break;
                        } else {
                            System.out.println("✗ Product discount not within valid date range");
                        }
                    }
                }
            }
            
            // If no product-specific discount, check brand and category discounts
            if (!hasActiveDiscount) {
                // Check brand discounts
                if (product.getBrand() != null) {
                    List<DiscountRule> brandDiscountRules = discountRuleRepo.findByBrandIdAndDiscountStatusTrue(product.getBrand().getId());
                    for (DiscountRule discountRule : brandDiscountRules) {
                        Discount discount = discountRule.getDiscount();
                        if (discount != null && discount.isStatus()) {
                            LocalDate startDate = discount.getStartDate();
                            LocalDate endDate = discount.getEndDate();
                            
                            if (startDate != null && endDate != null && 
                                today.isAfter(startDate.minusDays(1)) && today.isBefore(endDate.plusDays(1))) {
                                System.out.println("✓ Found active brand discount for product " + product.getId());
                                hasActiveDiscount = true;
                                break;
                            }
                        }
                    }
                }
                
                // Check category discounts
                if (!hasActiveDiscount && product.getProductCategories() != null) {
                    for (ProductHasCategory phc : product.getProductCategories()) {
                        if (phc.getCategory() != null) {
                            List<DiscountRule> categoryDiscountRules = discountRuleRepo.findByCategoryIdAndDiscountStatusTrue(phc.getCategory().getId());
                            for (DiscountRule discountRule : categoryDiscountRules) {
                                Discount discount = discountRule.getDiscount();
                                if (discount != null && discount.isStatus()) {
                                    LocalDate startDate = discount.getStartDate();
                                    LocalDate endDate = discount.getEndDate();
                                    
                                    if (startDate != null && endDate != null && 
                                        today.isAfter(startDate.minusDays(1)) && today.isBefore(endDate.plusDays(1))) {
                                        System.out.println("✓ Found active category discount for product " + product.getId());
                                        hasActiveDiscount = true;
                                        break;
                                    }
                                }
                            }
                            if (hasActiveDiscount) break;
                        }
                    }
                }
            }
            
            if (hasActiveDiscount) {
                productsWithDiscounts.add(product);
            }
            
            if (productsWithDiscounts.size() >= limit) {
                System.out.println("Reached limit of " + limit + " products with discounts");
                break; // We have enough products with discounts
            }
        }
        
        System.out.println("Final result: " + productsWithDiscounts.size() + " products with active discounts");
        return productsWithDiscounts;
    }

    private List<Product> getRandomProductsByCategoriesAndBrands(Set<Long> categoryIds, Set<Long> brandIds, int limit) {
        if (categoryIds.isEmpty() && brandIds.isEmpty()) {
            return proRepo.findTop5ByOrderByCreateDateDesc();
        }
        
        List<Product> products = new ArrayList<>();
        
        // Get products by categories
        if (!categoryIds.isEmpty()) {
            for (Long categoryId : categoryIds) {
                List<Product> categoryProducts = proRepo.findByCategoryId(categoryId);
                products.addAll(categoryProducts);
            }
        }
        
        // Get products by brands
        if (!brandIds.isEmpty()) {
            for (Long brandId : brandIds) {
                List<Product> brandProducts = proRepo.findByBrandId(brandId);
                products.addAll(brandProducts);
            }
        }
        
        // Remove duplicates and filter active products
        products = products.stream()
                .distinct()
                .filter(p -> p.getStatus() != null && p.getStatus() == 1)
                .collect(Collectors.toList());
        
        // Shuffle and limit to requested number
        Collections.shuffle(products);
        return products.stream().limit(limit).collect(Collectors.toList());
    }

    private boolean hasActiveDiscount(Product product) {
        LocalDate today = LocalDate.now();
        
        // Check product-specific discount rules
        List<DiscountRule> productDiscountRules = discountRuleRepo.findByProductIdAndDiscountStatusTrue(product.getId());
        if (productDiscountRules != null && !productDiscountRules.isEmpty()) {
            for (DiscountRule discountRule : productDiscountRules) {
                Discount discount = discountRule.getDiscount();
                if (discount != null && discount.isStatus()) {
                    LocalDate startDate = discount.getStartDate();
                    LocalDate endDate = discount.getEndDate();
                    
                    if (startDate != null && endDate != null && 
                        today.isAfter(startDate.minusDays(1)) && today.isBefore(endDate.plusDays(1))) {
                        return true;
                    }
                }
            }
        }
        
        // Check brand discounts
        if (product.getBrand() != null) {
            List<DiscountRule> brandDiscountRules = discountRuleRepo.findByBrandIdAndDiscountStatusTrue(product.getBrand().getId());
            for (DiscountRule discountRule : brandDiscountRules) {
                Discount discount = discountRule.getDiscount();
                if (discount != null && discount.isStatus()) {
                    LocalDate startDate = discount.getStartDate();
                    LocalDate endDate = discount.getEndDate();
                    
                    if (startDate != null && endDate != null && 
                        today.isAfter(startDate.minusDays(1)) && today.isBefore(endDate.plusDays(1))) {
                        return true;
                    }
                }
            }
        }
        
        // Check category discounts
        if (product.getProductCategories() != null) {
            for (ProductHasCategory phc : product.getProductCategories()) {
                if (phc.getCategory() != null) {
                    List<DiscountRule> categoryDiscountRules = discountRuleRepo.findByCategoryIdAndDiscountStatusTrue(phc.getCategory().getId());
                    for (DiscountRule discountRule : categoryDiscountRules) {
                        Discount discount = discountRule.getDiscount();
                        if (discount != null && discount.isStatus()) {
                            LocalDate startDate = discount.getStartDate();
                            LocalDate endDate = discount.getEndDate();
                            
                            if (startDate != null && endDate != null && 
                                today.isAfter(startDate.minusDays(1)) && today.isBefore(endDate.plusDays(1))) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        
        return false;
    }

    private List<Product> getProductsByCategoriesAndBrandsOrderedByDate(Set<Long> categoryIds, Set<Long> brandIds, int limit) {
        if (categoryIds.isEmpty() && brandIds.isEmpty()) {
            // If no categories or brands, return latest products
            return proRepo.findTop10ByOrderByCreateDateDesc();
        }

        List<Product> products = new ArrayList<>();

        // Get products by categories
        if (!categoryIds.isEmpty()) {
            for (Long categoryId : categoryIds) {
                List<Product> categoryProducts = proRepo.findByCategoryId(categoryId);
                products.addAll(categoryProducts);
            }
        }

        // Get products by brands
        if (!brandIds.isEmpty()) {
            for (Long brandId : brandIds) {
                List<Product> brandProducts = proRepo.findByBrandId(brandId);
                products.addAll(brandProducts);
            }
        }

        // Remove duplicates and filter active products, then order by creation date
        products = products.stream()
            .filter(p -> p.getStatus() != null && p.getStatus() == 1)
            .distinct()
            .sorted((p1, p2) -> {
                if (p1.getCreateDate() == null && p2.getCreateDate() == null) return 0;
                if (p1.getCreateDate() == null) return 1;
                if (p2.getCreateDate() == null) return -1;
                return p2.getCreateDate().compareTo(p1.getCreateDate()); // Descending order (newest first)
            })
            .collect(Collectors.toList());

        return products.stream().limit(limit).collect(Collectors.toList());
    }

    private TrendingProductDTO convertToTrendingDTO(Product product) {
        // Get review data
        Double avgRating = reviewRepo.getAverageRatingByProductId(product.getId());
        Long reviewCount = reviewRepo.getReviewCountByProductId(product.getId());
        
        // Check for events and discounts
        Boolean hasEvent = false;
        Boolean hasDiscount = false;
        String eventName = null;
        String discountName = null;
        Double discountValue = null;
        String discountType = null;
        
        // Check if product has events
        List<EventProduct> eventProducts = eventProductRepo.findByProduct(product);
        System.out.println("Product " + product.getId() + " event products: " + (eventProducts != null ? eventProducts.size() : 0));
        if (eventProducts != null && !eventProducts.isEmpty()) {
            // Find active events
            for (EventProduct eventProduct : eventProducts) {
                Events event = eventProduct.getEvents();
                System.out.println("Event: " + (event != null ? event.getName() + " status: " + event.getStatus() : "null"));
                if (event != null && event.getStatus() != null && event.getStatus() == 1) {
                    hasEvent = true;
                    eventName = "Special"; // Always show "Special" for events
                    System.out.println("Found active event: " + event.getName() + ", showing as: " + eventName);
                    break; // Use the first active event
                }
            }
        }
        
        // Check if product has discounts using discount rules
            LocalDate today = LocalDate.now();
        boolean discountFound = false;
        
        // Check product-specific discount rules
        List<DiscountRule> productDiscountRules = discountRuleRepo.findByProductIdAndDiscountStatusTrue(product.getId());
        System.out.println("Product " + product.getId() + " product discount rules: " + (productDiscountRules != null ? productDiscountRules.size() : 0));
        
        if (productDiscountRules != null && !productDiscountRules.isEmpty()) {
            for (DiscountRule discountRule : productDiscountRules) {
                Discount discount = discountRule.getDiscount();
                System.out.println("Product Discount: " + (discount != null ? discount.getName() + " status: " + discount.isStatus() : "null"));
                if (discount != null && discount.isStatus()) {
                    LocalDate startDate = discount.getStartDate();
                    LocalDate endDate = discount.getEndDate();
                    
                    System.out.println("Discount dates - Start: " + startDate + ", End: " + endDate + ", Today: " + today);
                    
                    if (startDate != null && endDate != null && 
                        today.isAfter(startDate.minusDays(1)) && today.isBefore(endDate.plusDays(1))) {
                        hasDiscount = true;
                        discountName = discount.getName();
                        discountValue = discount.getDiscountValue();
                        discountType = discount.getDiscountType() != null ? discount.getDiscountType().toString() : null;
                        discountFound = true;
                        System.out.println("✓ Found active product discount: " + discountName + " value: " + discountValue + " type: " + discountType);
                        break;
                    } else {
                        System.out.println("✗ Product discount " + discount.getName() + " is not within valid date range");
                    }
                }
            }
        }
        
        // If no product-specific discount, check brand discounts
        if (!discountFound && product.getBrand() != null) {
            List<DiscountRule> brandDiscountRules = discountRuleRepo.findByBrandIdAndDiscountStatusTrue(product.getBrand().getId());
            for (DiscountRule discountRule : brandDiscountRules) {
                Discount discount = discountRule.getDiscount();
                if (discount != null && discount.isStatus()) {
                    LocalDate startDate = discount.getStartDate();
                    LocalDate endDate = discount.getEndDate();
                    
                    if (startDate != null && endDate != null && 
                        today.isAfter(startDate.minusDays(1)) && today.isBefore(endDate.plusDays(1))) {
                        hasDiscount = true;
                        discountName = discount.getName();
                        discountValue = discount.getDiscountValue();
                        discountType = discount.getDiscountType() != null ? discount.getDiscountType().toString() : null;
                        discountFound = true;
                        System.out.println("✓ Found active brand discount: " + discountName + " value: " + discountValue + " type: " + discountType);
                        break;
                    }
                }
            }
        }
        
        // If no brand discount, check category discounts
        if (!discountFound && product.getProductCategories() != null) {
            for (ProductHasCategory phc : product.getProductCategories()) {
                if (phc.getCategory() != null) {
                    List<DiscountRule> categoryDiscountRules = discountRuleRepo.findByCategoryIdAndDiscountStatusTrue(phc.getCategory().getId());
                    for (DiscountRule discountRule : categoryDiscountRules) {
                        Discount discount = discountRule.getDiscount();
                        if (discount != null && discount.isStatus()) {
                            LocalDate startDate = discount.getStartDate();
                            LocalDate endDate = discount.getEndDate();
                            
                            if (startDate != null && endDate != null && 
                                today.isAfter(startDate.minusDays(1)) && today.isBefore(endDate.plusDays(1))) {
                                hasDiscount = true;
                                discountName = discount.getName();
                                discountValue = discount.getDiscountValue();
                                discountType = discount.getDiscountType() != null ? discount.getDiscountType().toString() : null;
                                discountFound = true;
                                System.out.println("✓ Found active category discount: " + discountName + " value: " + discountValue + " type: " + discountType);
                                break;
                            }
                        }
                    }
                    if (discountFound) break;
                }
            }
        }
        
        if (!discountFound) {
            System.out.println("✗ No active discounts found for product " + product.getId());
        }
        
        TrendingProductDTO result = TrendingProductDTO.builder()
                .id(product.getId())
                .productName(product.getProductName())
                .productCode(product.getProductCode())
                .price(product.getPrice() != null ? product.getPrice() : 0.0)
                .quantity(product.getQuantity())
                .description(product.getDescription())
                .status(product.getStatus() != null ? product.getStatus().longValue() : null)
                .productImages(product.getProductImages().stream()
                        .map(img -> {
                            ProductImageDTO pidto = new ProductImageDTO();
                            pidto.setId(img.getId());
                            pidto.setImageUrl(img.getImageUrl());
                            pidto.setStatus(img.getStatus());
                            pidto.setVariantId(img.getProductVariant() != null ? img.getProductVariant().getId().longValue() : null);
                            return pidto;
                        }).collect(Collectors.toList()))
                .categoryBrandPairs(product.getProductCategories().stream()
                        .map(pc -> new CategoryBrandPair(
                                pc.getCategory().getId(),
                                pc.getCategory().getName(),
                                pc.getBrand() != null ? pc.getBrand().getId() : null,
                                pc.getBrand() != null ? pc.getBrand().getName() : null
                        ))
                        .distinct()
                        .collect(Collectors.toList()))
                .averageRating(avgRating != null ? avgRating : 0.0)
                .reviewCount(reviewCount != null ? reviewCount : 0L)
                .hasEvent(hasEvent)
                .hasDiscount(hasDiscount)
                .eventName(eventName)
                .discountName(discountName)
                .discountValue(discountValue)
                .discountType(discountType)
                .build();
        
        System.out.println("Final result for product " + product.getId() + ": hasEvent=" + hasEvent + ", hasDiscount=" + hasDiscount + ", eventName=" + eventName + ", discountName=" + discountName);
        return result;
    }

    public List<ProductDTO> searchProducts(String keyword) {
        List<Product> products = proRepo.searchProducts(keyword);
        return products.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<ProductDTO> searchProductsComprehensive(String keyword) {
        List<Product> products = proRepo.searchProductsComprehensive(keyword);
        return products.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<ProductDTO> liveSearch(String keyword) {
        List<Product> products = proRepo.liveSearch(keyword);
        return products.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    public List<Discount> getAllDiscounts() {
        return discountRepo.findAll();
    }

}