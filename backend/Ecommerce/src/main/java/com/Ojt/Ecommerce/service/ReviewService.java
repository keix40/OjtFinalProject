package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.ReviewDTO;
import com.Ojt.Ecommerce.dto.ReviewMediaDTO;
import com.Ojt.Ecommerce.entity.MediaType;
import com.Ojt.Ecommerce.entity.Review;
import com.Ojt.Ecommerce.dto.ReviewMessageDTO;
import com.Ojt.Ecommerce.entity.ReviewMedia;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.repository.ProductRepository;
import com.Ojt.Ecommerce.repository.ReviewMediaRepository;
import com.Ojt.Ecommerce.repository.ReviewRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import jakarta.transaction.Transactional;
import com.Ojt.Ecommerce.util.FileUploadSanitizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
@Service
public class ReviewService {

    @Autowired
    private ReviewRepository repo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private ProductRepository productRepo;

    @Autowired
    private ReviewMediaRepository rmRepo;

    @Autowired
    private NotificationService notificationService;

    @Value("${app.upload.review-dir:review}")
    private String reviewUploadDir;

    public Review saveReview(ReviewMessageDTO msg) {
        Review review = new Review();
        review.setProduct(productRepo.findById(msg.getProductId()).orElseThrow());
        review.setUser((User) userRepo.findByName(msg.getUsername()).orElseThrow());
        review.setComment(msg.getComment());
        review.setRating(msg.getRating());
        
        Review savedReview = repo.save(review);
        
        // Send notification to admin and customer support
        String reviewMessage = String.format(
            "New product review submitted by %s\n" +
            "Product: %s\n" +
            "Rating: %d/5 stars\n" +
            "Comment: %s",
            review.getUser().getEmail(),
            review.getProduct().getProductName(),
            review.getRating(),
            review.getComment().length() > 100 ? review.getComment().substring(0, 100) + "..." : review.getComment()
        );
        
        notificationService.sendToAdminAndCustomerSupport(
            reviewMessage,
            "review",
            "submitted",
            "/admin/reviews"
        );
        
        return savedReview;
    }

    @Transactional
    public Review saveReviewWithMedia(Long productId, String username, int rating, String comment, MultipartFile[] files) throws IOException {
        Review review = new Review();
        review.setProduct(productRepo.findById(productId).orElseThrow());
        review.setUser(userRepo.findByName(username).orElseThrow());
        review.setComment(comment);
        review.setRating(rating);

        if (files != null && files.length > 0) {
            for (MultipartFile file : files) {
                try {
                    FileUploadSanitizer.validateMediaUpload(file);
                    ReviewMedia media = new ReviewMedia();
                    media.setType(file.getContentType().startsWith("video") ? MediaType.VIDEO : MediaType.IMAGE);
                    String filename = FileUploadSanitizer.safeFilename(file.getOriginalFilename());
                    Path path = FileUploadSanitizer.resolveUploadPath(reviewUploadDir, filename);
                    Files.createDirectories(path.getParent());
                    Files.write(path, file.getBytes());

                    media.setMediaUrl("/review/" + filename);
                    media.setReview(review);

                    review.getMediaList().add(media);
                } catch (IOException e) {
                    System.err.println("Failed to save file: " + file.getOriginalFilename());
                    e.printStackTrace();
                    throw new RuntimeException("Error saving review media file.");
                }
            }
        }

        Review savedReview = repo.save(review);
        
        // Send notification to admin and customer support
        String reviewMessage = String.format(
            "New product review submitted by %s\n" +
            "Product: %s\n" +
            "Rating: %d/5 stars\n" +
            "Comment: %s",
            review.getUser().getEmail(),
            review.getProduct().getProductName(),
            review.getRating(),
            review.getComment().length() > 100 ? review.getComment().substring(0, 100) + "..." : review.getComment()
        );
        
        notificationService.sendToAdminAndCustomerSupport(
            reviewMessage,
            "review",
            "submitted",
            "/admin/reviews"
        );
        
        return savedReview;
    }

    public Review updateReviewWithMedia(Long id, int rating, String comment,
                                        MultipartFile[] newFiles,
                                        List<String> removedMediaUrls) throws IOException {

        Review review = repo.findById(id).orElseThrow();
        review.setRating(rating);
        review.setComment(comment);
        review.setTimestamp(LocalDateTime.now());

        // Remove only selected old media
        if (removedMediaUrls != null && !removedMediaUrls.isEmpty()) {
            review.getMediaList().removeIf(media -> removedMediaUrls.contains(media.getMediaUrl()));

            // Optionally delete physical files too
            for (String url : removedMediaUrls) {
                String filename = url.replace("/review/", "");
                Path path = FileUploadSanitizer.resolveUploadPath(reviewUploadDir, filename);
                Files.deleteIfExists(path);
            }
        }

        // Add new uploaded files
        if (newFiles != null && newFiles.length > 0) {
            for (MultipartFile file : newFiles) {
                FileUploadSanitizer.validateMediaUpload(file);
                ReviewMedia media = new ReviewMedia();
                media.setType(file.getContentType().startsWith("video") ? MediaType.VIDEO : MediaType.IMAGE);
                String filename = FileUploadSanitizer.safeFilename(file.getOriginalFilename());
                Path path = FileUploadSanitizer.resolveUploadPath(reviewUploadDir, filename);
                Files.createDirectories(path.getParent());
                Files.write(path, file.getBytes());

                media.setMediaUrl("/review/" + filename);
                media.setReview(review);

                review.getMediaList().add(media);
            }
        }

        return repo.save(review);
    }

    public ReviewMessageDTO toDto(Review review, String action) {
        List<String> imageUrls = review.getMediaList().stream()
                .filter(m -> m.getType() == MediaType.IMAGE)
                .map(ReviewMedia::getMediaUrl)
                .collect(Collectors.toList());

        List<String> videoUrls = review.getMediaList().stream()
                .filter(m -> m.getType() == MediaType.VIDEO)
                .map(ReviewMedia::getMediaUrl)
                .collect(Collectors.toList());

        return new ReviewMessageDTO(
                review.getId(),
                review.getProduct().getId(),
                review.getUser().getName(),
                review.getComment(),
                review.getRating(),
                review.getTimestamp(),
                action,
                review.getUser().getProfileImage(),
                imageUrls,
                videoUrls
        );
    }

    public List<ReviewMessageDTO> getReviewsByProduct(Long productId) {
        return repo.findByProductIdOrderByTimestampDesc(productId).stream()
                .map(r -> toDto(r, "create"))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteReview(Long id) {
        Review review = repo.findById(id).orElseThrow(() -> new RuntimeException("Review not found"));

        // Delete media files from disk
        for (ReviewMedia media : review.getMediaList()) {
            String filename = media.getMediaUrl().replace("/review/", "");
            try {
                Path path = FileUploadSanitizer.resolveUploadPath(reviewUploadDir, filename);
                Files.deleteIfExists(path);
            } catch (IOException | IllegalArgumentException e) {
                // ignore missing or invalid paths during cleanup
            }
        }

        // Clear media list to trigger orphanRemoval cascade delete
        review.getMediaList().clear();

        // Delete review entity
        repo.delete(review);
    }
    public List<ReviewDTO> getTop3FiveStarReviews() {
        return repo.findTop3ByRatingFive()
                .stream()
                .limit(3)
                .map(this::convertToDto)
                .toList();
    }

    private ReviewDTO convertToDto(Review r) {
        return ReviewDTO.builder()
                .id(r.getId())
                .comment(r.getComment())
                .rating(r.getRating())
                .timestamp(r.getTimestamp())
                .userName(r.getUser().getName())
                .productId(r.getProduct().getId())
                .userImage(r.getUser().getProfileImage())
                .productName(r.getProduct().getProductName())
                .mediaList(
                        r.getMediaList().stream().map(m -> ReviewMediaDTO.builder()
                                .id(m.getId())
                                .type(String.valueOf(m.getType()))
                                .url(m.getMediaUrl())
                                .build()).toList()
                )
                .build();
    }

    public List<ReviewDTO> getAllReviewsByUserId(Long userId) {
        List<Review> reviews = repo.findAllByUserId(userId);

        return reviews.stream().map(this::convertToDto).toList(); // Use your existing mapToDTO method
    }

}

