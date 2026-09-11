package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.util.FileUploadSanitizer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class FileStorageService {

    @Value("${app.upload.return-images-dir:return_images}")
    private String returnImagesDir;

    public String saveFile(MultipartFile file) {
        try {
            FileUploadSanitizer.validateImageUpload(file);
            String filename = FileUploadSanitizer.safeFilename(file.getOriginalFilename());
            Path target = FileUploadSanitizer.resolveUploadPath(returnImagesDir, filename);
            Files.createDirectories(target.getParent());
            file.transferTo(target.toFile());
            return "/return_images/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save image", e);
        }
    }
}
