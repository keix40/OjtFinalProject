package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.*;
import com.Ojt.Ecommerce.entity.*;
import com.Ojt.Ecommerce.repository.*;
import com.Ojt.Ecommerce.util.ProductCodeGeneratorUtil;
//import jakarta.transaction.Transactional;
import org.springframework.transaction.annotation.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

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

    @Transactional
    public Product saveProductWithImages(ProductDTO dto, MultipartFile[] files,Map<String, List<MultipartFile>> variantImageMap) throws IOException {
        String code;
        do {
            code = ProductCodeGeneratorUtil.generateRandomProductCode();
        } while (proRepo.existsByProductCode(code));

        Product product = Product.builder()
                .productName(dto.getProductName())
                .price(dto.getPrice())
                .quantity(dto.getQuantity())
                .description(dto.getDescription())
                .productCode(code)
                .createDate(LocalDateTime.now())
                .build();

        Product savedProduct = proRepo.save(product);

        Brand selectedBrand = null;
        if (dto.getCategoryBrandPairs() != null) {
            for (CategoryBrandPair pair : dto.getCategoryBrandPairs()) {
                if (pair.getBrandId() != null) {
                    selectedBrand = brandRepo.findById(pair.getBrandId()).orElse(null);
                    break;
                }
            }
        }
        if (selectedBrand != null) {
            savedProduct.setBrand(selectedBrand);
        }

// 👇 Save again after setting brand
        savedProduct = proRepo.save(savedProduct);

        Set<ProductHasCategory> phcList = new HashSet<>();//fix list to set 15.6.25

        if (dto.getCategoryBrandPairs() != null) {
            for (CategoryBrandPair pair : dto.getCategoryBrandPairs()) {
                Category category = cateRepo.findById(pair.getCategoryId()).orElse(null);

                // Only try to get brand if brandId is not null
                Brand brand = null;
                if (pair.getBrandId() != null) {
                    brand = brandRepo.findById(pair.getBrandId()).orElse(null);
                }

                if (category != null) {
                    ProductHasCategory phc = ProductHasCategory.builder()
                            .product(savedProduct)
                            .category(category)
                            .brand(brand) // this will be null if not selected
                            .build();
                    phcList.add(phc);
                }
            }
        }

        savedProduct.setProductCategories(phcList);

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

        int variantImageIndex = 0;
//        if (dto.getHasVariant() != null && dto.getHasVariant()) {
//            // 1. Save each variant
//            for (VariantDTO variantDTO : dto.getVariants()) {
//                ProductVariant variant = ProductVariant.builder()
//                        .price(BigDecimal.valueOf(variantDTO.getPrice()))
//                        .stock(variantDTO.getStock())
//                        .stockKeeping(variantDTO.getSku())
//                        .product(savedProduct)
//                        .build();
//
//                variant = variantRepo.save(variant);
//
//                // 2. Save each variant's attribute-value mapping
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
//                if (variantImages != null && variantImageIndex < variantImages.length) {
//                    MultipartFile variantImageFile = variantImages[variantImageIndex];
//                    if (!variantImageFile.isEmpty()) {
//                        String fileName = UUID.randomUUID() + "_" + variantImageFile.getOriginalFilename();
//                        Path filePath = uploadPath.resolve(fileName);
//                        Files.copy(variantImageFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
//
//                        ProductImage variantImage = ProductImage.builder()
//                                .imageUrl("/product_image/" + fileName)
//                                .product(savedProduct)
//                                .productVariant(variant)
//                                .status(1)
//                                .build();
//                        productImageRepo.save(variantImage);
//                    }
//                    variantImageIndex++;
//                }
//
//            }
//        }

        if (dto.getHasVariant() != null && dto.getHasVariant()) {
            // ✅ FIXED: Use index-based loop so we have access to `i`
            for (int i = 0; i < dto.getVariants().size(); i++) {
                VariantDTO variantDTO = dto.getVariants().get(i);

                ProductVariant variant = ProductVariant.builder()
                        .price(BigDecimal.valueOf(variantDTO.getPrice()))
                        .stock(variantDTO.getStock())
                        .stockKeeping(variantDTO.getSku())
                        .product(savedProduct)
                        .build();

                variant = variantRepo.save(variant);

                // 2. Save variant's attribute-value mapping
                for (VariantAttributeDTO attr : variantDTO.getAttributes()) {
                    Long attrId = attr.getAttributeId();
                    Long valueId = attr.getValueId();

                    AttributeValue attrValue = attrValueRepo.findById(valueId).orElse(null);
                    if (attrValue != null) {
                        VariantAttributeValue vav = VariantAttributeValue.builder()
                                .attributeValue(attrValue)
                                .productVariant(variant)
                                .build();
                        variantAttributeValueRepo.save(vav);
                    }
                }

                // ✅ Handle variant images per index
                List<MultipartFile> imagesForVariant = variantImageMap.get("variantImages_" + i);
                if (imagesForVariant != null && !imagesForVariant.isEmpty()) {
                    for (MultipartFile variantImageFile : imagesForVariant) {
                        if (!variantImageFile.isEmpty()) {
                            String fileName = UUID.randomUUID() + "_" + variantImageFile.getOriginalFilename();
                            Path filePath = uploadPath.resolve(fileName);
                            Files.copy(variantImageFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

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



        return proRepo.save(savedProduct);
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

    private ProductDTO convertToDTO(Product product) {
        ProductDTO dto = mapper.map(product, ProductDTO.class);

        // Manually map images to avoid PersistentBag issues
        if (product.getProductImages() != null) {
            dto.setProductImages(
                    product.getProductImages().stream()
                            .map(image -> new ProductImageDTO(image.getId(), image.getImageUrl(), image.getStatus()))
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

        List<ProductImageDTO> images = product.getProductImages().stream()
                .map(img -> new ProductImageDTO(
                        img.getId(),
                        img.getImageUrl(),
                        img.getStatus()
                ))
                .collect(Collectors.toList());
        dto.setProductImages(images);

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
        List<Object[]> rows = proRepo.getAdminProductDetail(productId);
        if (rows.isEmpty()) return null;

        ProductDTO dto = new ProductDTO();
        dto.setId(((Number) rows.get(0)[0]).longValue());
        dto.setProductName((String) rows.get(0)[1]);
        dto.setProductCode((String) rows.get(0)[2]);
        dto.setDescription((String) rows.get(0)[3]);
        dto.setStatus(rows.get(0)[4] != null ? ((Number) rows.get(0)[4]).longValue() : 1L);

        // Handle brand
        dto.setCategoryBrandPairs(new ArrayList<>());
//        CategoryBrandPair cb = new CategoryBrandPair();
//        cb.setBrandId(rows.get(0)[7] != null ? ((Number) rows.get(0)[7]).longValue() : null);
//        cb.setBrandName((String) rows.get(0)[8]);

        // Handle categories
        Set<String> categories = new HashSet<>();
        for (Object[] row : rows) {
            String cateName = (String) row[10];
            if (cateName != null) categories.add(cateName);
        }
        for (String category : categories) {
            CategoryBrandPair cb = new CategoryBrandPair();
            cb.setCateName(category);  // single category name (String)
            cb.setBrandId(rows.get(0)[7] != null ? ((Number) rows.get(0)[7]).longValue() : null);
            cb.setBrandName((String) rows.get(0)[8]);
            dto.getCategoryBrandPairs().add(cb);
        }

        // Handle images
        Map<Long, ProductImageDTO> imageMap = new LinkedHashMap<>();
        for (Object[] row : rows) {
            if (row[11] == null) continue;

            Long imageId = ((Number) row[11]).longValue();
            if (!imageMap.containsKey(imageId)) {
                ProductImageDTO img = new ProductImageDTO();
                img.setImageUrl((String) row[12]);
                img.setStatus(row[13] != null ? ((Number) row[13]).intValue() : 1); // ✅ use intValue instead of longValue
                img.setVariantId(row[14] != null ? ((Number) row[14]).longValue() : null);
                imageMap.put(imageId, img);
            }
        }
        dto.setProductImages(new ArrayList<>(imageMap.values()));

        // Handle variants
        Map<Long, VariantDTO> variantMap = new HashMap<>();
        Map<Long, List<VariantAttributeDTO>> attrMap = new HashMap<>();

        for (Object[] row : rows) {
            Long variantId = row[15] != null ? ((Number) row[15]).longValue() : null;
            if (variantId == null) continue;

            VariantDTO variant = variantMap.computeIfAbsent(variantId, id -> {
                VariantDTO v = new VariantDTO();
                v.setSku((String) row[16]);
                v.setPrice(row[17] != null ? ((Number) row[17]).doubleValue() : 0);
                v.setStock(row[18] != null ? ((Number) row[18]).intValue() : 0);
                v.setAttributes(new ArrayList<>());
                return v;
            });

            Long attrId = row[21] != null ? ((Number) row[21]).longValue() : null;
            Long valId = row[19] != null ? ((Number) row[19]).longValue() : null;
            if (attrId != null && valId != null) {
                VariantAttributeDTO attr = new VariantAttributeDTO();
                attr.setAttributeId(attrId);
                attr.setValueId(valId);
                attr.setAttributeName((String) row[22]); // optional

                variant.getAttributes().add(attr);
            }
        }

        dto.setVariants(new ArrayList<>(variantMap.values()));
        return dto;
    }
}

