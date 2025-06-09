package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.CategoryBrandPair;
import com.Ojt.Ecommerce.dto.ProductDTO;
import com.Ojt.Ecommerce.entity.*;
import com.Ojt.Ecommerce.repository.BrandRepository;
import com.Ojt.Ecommerce.repository.CategoryRepository;
import com.Ojt.Ecommerce.repository.ProductRepository;
import com.Ojt.Ecommerce.util.ProductCodeGeneratorUtil;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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

    public Product saveProductWithImages(ProductDTO dto, MultipartFile[] files) throws IOException {
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

        List<ProductHasCategory> phcList = new ArrayList<>();

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

        return proRepo.save(savedProduct);
    }

    public List<Product> getAllProduct(){
        return proRepo.findAllProduct();
    }

    @Transactional
    public void deleteProduce(Long id) {
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
}

