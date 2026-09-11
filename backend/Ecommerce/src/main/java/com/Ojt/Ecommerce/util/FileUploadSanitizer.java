package com.Ojt.Ecommerce.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

public final class FileUploadSanitizer {

    public static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"
    );

    public static final Set<String> ALLOWED_IMAGE_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"
    );

    public static final Set<String> ALLOWED_VIDEO_CONTENT_TYPES = Set.of(
            "video/mp4", "video/webm", "video/quicktime"
    );

    private FileUploadSanitizer() {
    }

    /** Strip path segments and unsafe characters; prefix with UUID. */
    public static String safeFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return UUID.randomUUID().toString();
        }
        String baseName = Paths.get(originalFilename).getFileName().toString();
        String sanitized = baseName.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (sanitized.isBlank() || sanitized.equals(".") || sanitized.equals("..")) {
            sanitized = "upload";
        }
        return UUID.randomUUID() + "_" + sanitized;
    }

    public static void validateImageUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("Missing filename");
        }
        String lower = filename.toLowerCase();
        boolean extOk = ALLOWED_IMAGE_EXTENSIONS.stream().anyMatch(lower::endsWith);
        if (!extOk) {
            throw new IllegalArgumentException("File type not allowed");
        }
        String contentType = file.getContentType();
        if (contentType != null && !ALLOWED_IMAGE_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Content type not allowed");
        }
    }

    public static void validateMediaUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        String contentType = file.getContentType();
        if (contentType == null) {
            throw new IllegalArgumentException("Missing content type");
        }
        String ct = contentType.toLowerCase();
        boolean allowed = ALLOWED_IMAGE_CONTENT_TYPES.contains(ct) || ALLOWED_VIDEO_CONTENT_TYPES.contains(ct);
        if (!allowed) {
            throw new IllegalArgumentException("Content type not allowed");
        }
    }

    public static Path resolveUploadPath(String uploadRoot, String safeFilename) {
        Path root = Paths.get(uploadRoot).toAbsolutePath().normalize();
        Path target = root.resolve(safeFilename).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalArgumentException("Path traversal detected");
        }
        return target;
    }

    /** Validate, store under uploadRoot, return public URL path (e.g. /product_image/uuid_file.jpg). */
    public static String saveValidatedImage(MultipartFile file, String uploadRoot, String publicUrlPrefix)
            throws IOException {
        validateImageUpload(file);
        return storeFile(file, uploadRoot, publicUrlPrefix);
    }

    /** Validate image or video, store, return public URL path. */
    public static String saveValidatedMedia(MultipartFile file, String uploadRoot, String publicUrlPrefix)
            throws IOException {
        validateMediaUpload(file);
        return storeFile(file, uploadRoot, publicUrlPrefix);
    }

    private static String storeFile(MultipartFile file, String uploadRoot, String publicUrlPrefix)
            throws IOException {
        String filename = safeFilename(file.getOriginalFilename());
        Path target = resolveUploadPath(uploadRoot, filename);
        Files.createDirectories(target.getParent());
        file.transferTo(target.toFile());
        String prefix = publicUrlPrefix.endsWith("/") ? publicUrlPrefix : publicUrlPrefix + "/";
        return prefix + filename;
    }
}
