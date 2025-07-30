package com.Ojt.Ecommerce.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;

@Service
public class FileStorageService {

    private static final String RETURN_IMAGE_DIR = "C:/Users/HP/OjtFinalProject/backend/Ecommerce/return_images/";

    public String saveFile(MultipartFile file) {
        try {
            Files.createDirectories(Paths.get(RETURN_IMAGE_DIR));
            String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(RETURN_IMAGE_DIR + filename);
            file.transferTo(filePath);
            return "/return_images/" + filename; // ✅ return accessible URL path
        } catch (IOException e) {
            throw new RuntimeException("Failed to save image", e);
        }
    }
}
