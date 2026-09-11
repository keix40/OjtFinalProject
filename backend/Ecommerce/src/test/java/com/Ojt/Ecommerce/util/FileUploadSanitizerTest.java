package com.Ojt.Ecommerce.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class FileUploadSanitizerTest {

    @TempDir
    Path tempDir;

    @Test
    void safeFilename_stripsPathTraversal() {
        String safe = FileUploadSanitizer.safeFilename("../../etc/passwd");
        assertFalse(safe.contains(".."));
        assertFalse(safe.contains("/"));
    }

    @Test
    void resolveUploadPath_rejectsTraversal() {
        assertThrows(IllegalArgumentException.class, () ->
                FileUploadSanitizer.resolveUploadPath(tempDir.toString(), "../outside.txt"));
    }

    @Test
    void resolveUploadPath_allowsNormalFile() {
        Path resolved = FileUploadSanitizer.resolveUploadPath(tempDir.toString(), "photo.jpg");
        assertTrue(resolved.startsWith(tempDir.toAbsolutePath().normalize()));
    }
}
