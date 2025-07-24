package com.Ojt.Ecommerce.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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
import com.Ojt.Ecommerce.entity.AttributeValue;
import com.Ojt.Ecommerce.entity.Brand;
import com.Ojt.Ecommerce.entity.Category;
import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.entity.ProductHasCategory;
import com.Ojt.Ecommerce.entity.ProductImage;
import com.Ojt.Ecommerce.entity.ProductVariant;
import com.Ojt.Ecommerce.entity.VariantAttributeValue;
import com.Ojt.Ecommerce.repository.AttributeValueRepository;
import com.Ojt.Ecommerce.repository.BrandRepository;
import com.Ojt.Ecommerce.repository.CategoryRepository;
import com.Ojt.Ecommerce.repository.ProductHasCategoryRepository;
import com.Ojt.Ecommerce.repository.ProductImageRepository;
import com.Ojt.Ecommerce.repository.ProductRepository;
import com.Ojt.Ecommerce.repository.ProductVariantRepository;
import com.Ojt.Ecommerce.repository.VariantAttributeValueRepository;
import com.Ojt.Ecommerce.util.ProductCodeGeneratorUtil;

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
        return proRepo.save(savedProduct);
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

                // Remove and re-insert attribute values
                variantAttributeValueRepo.deleteByProductVariant(variant);
                for (VariantAttributeDTO attr : variantDTO.getAttributes()) {
                    AttributeValue attrValue = attrValueRepo.findById(attr.getValueId()).orElse(null);
                    if (attrValue != null) {
                        VariantAttributeValue vav = VariantAttributeValue.builder()
                                .productVariant(variant)
                                .attributeValue(attrValue)
                                .build();
                        variantAttributeValueRepo.save(vav);
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

//            // Instead of setProductVariants, mutate the existing list
//            product.getProductVariants().clear();
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

    public ProductDTO getProductDetailById(Long productId) {
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

        // You can build attributes for filters from variant attributes similarly if needed

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

    public List<Product> getTop4OrderedProducts() {
        return proRepo.findTop4OrderedProductsNative();
    }

    public List<ProductDTO> searchProducts(String keyword) {
        List<Product> products = proRepo.searchProducts(keyword);
        return products.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

}