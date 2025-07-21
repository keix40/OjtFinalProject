package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.ReviewDTO;
import com.Ojt.Ecommerce.entity.Review;
import com.Ojt.Ecommerce.dto.ReviewMessageDTO;
import com.Ojt.Ecommerce.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
public class ReviewSocketController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private static final String MEDIA_UPLOAD_DIR = "C:/Users/HP/OjtFinalProject/backend/Ecommerce/review/";

    @PostMapping(value = "/review", produces = MediaType.APPLICATION_JSON_VALUE)
    public void handleReview(
            @RequestParam("productId") Long productId,
            @RequestParam("username") String username,
            @RequestParam(value = "rating", required = false, defaultValue = "0") int rating,
            @RequestParam(value = "comment", required = false, defaultValue = "") String comment,
            @RequestParam("action") String action,
            @RequestParam(value = "id", required = false) Long id,
            @RequestParam(value = "media", required = false) MultipartFile[] mediaFiles,
            @RequestParam(value = "removedMedia", required = false) List<String> removedMedia
    ) throws IOException {
        ReviewMessageDTO msg;

        switch (action.toLowerCase()) {
            case "create":
                Review created = reviewService.saveReviewWithMedia(productId, username, rating, comment, mediaFiles);
                msg = reviewService.toDto(created, "create");
                break;
            case "update":
                Review updated = reviewService.updateReviewWithMedia(id, rating, comment, mediaFiles, removedMedia);
                msg = reviewService.toDto(updated, "update");
                break;
            case "delete":
                reviewService.deleteReview(id);
                msg = new ReviewMessageDTO();
                msg.setId(id);
                msg.setProductId(productId);
                msg.setUsername(username);
                msg.setAction("delete");
                break;
            default:
                throw new IllegalArgumentException("Invalid action: " + action);
        }

        messagingTemplate.convertAndSend("/topic/reviews." + msg.getProductId(), msg);
    }

    @MessageMapping("/history")
    @SendToUser("/queue/review-history")
    public List<ReviewMessageDTO> fetchHistory(String productId) {
        return reviewService.getReviewsByProduct(Long.parseLong(productId));
    }

    // === Media file serving endpoint ===
    @GetMapping("/review/{filename:.+}")
    public ResponseEntity<Resource> serveMedia(@PathVariable String filename) {
        try {
            Path file = Paths.get(MEDIA_UPLOAD_DIR).resolve(filename);
            Resource resource = new UrlResource(file.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            // Guess content type based on file extension
            String contentType = Files.probeContentType(file);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);

        } catch (MalformedURLException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/review/top5star")
    public ResponseEntity<List<ReviewDTO>> getTop5StarReviews() {
        return ResponseEntity.ok(reviewService.getTop3FiveStarReviews());
    }
}
