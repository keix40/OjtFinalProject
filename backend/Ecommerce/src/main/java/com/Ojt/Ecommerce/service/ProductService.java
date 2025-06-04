package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.entity.ProductImage;
import com.Ojt.Ecommerce.repository.ProductRepository;
import com.Ojt.Ecommerce.util.ProductCodeGeneratorUtil;
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
    private final Path uploadPath = Paths.get("product_image");

    @Autowired
    private ProductRepository proRepo;

    @Autowired
    private ModelMapper mapper;

    public Product saveProductImages(Product product, MultipartFile[] files) throws IOException {
        String code;
        do{
            code = ProductCodeGeneratorUtil.generateRandomProductCode();
        }while (proRepo.existsByProductCode(code));

        product.setProductCode(code);
        product.setCreateDate(LocalDateTime.now());

        Product savedProduct = proRepo.save(product);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        List<ProductImage> imageList = new ArrayList<>();
        for (MultipartFile file : files){
            if(!file.isEmpty()){
                String fileName = UUID.randomUUID()+ "_" + file.getOriginalFilename();
                Path filePath = uploadPath.resolve(fileName);

                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                ProductImage image = ProductImage.builder()
                        .imageUrl("/product_image/" + fileName)
                        .status(1)
                        .product(savedProduct)
                        .build();

                imageList.add(image);
            }
        }
        savedProduct.setProductImages(imageList);
        return proRepo.save(savedProduct);
    }
}

