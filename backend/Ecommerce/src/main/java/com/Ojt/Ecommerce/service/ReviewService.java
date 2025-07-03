package com.Ojt.Ecommerce.service;

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
import org.springframework.beans.factory.annotation.Autowired;
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

    private static final String MEDIA_UPLOAD_DIR = "C:/Users/HP/OjtFinalProject/backend/Ecommerce/review/";

    public Review saveReview(ReviewMessageDTO msg) {
        Review review = new Review();
        review.setProduct(productRepo.findById(msg.getProductId()).orElseThrow());
        review.setUser((User) userRepo.findByName(msg.getUsername()).orElseThrow());
        review.setComment(msg.getComment());
        review.setRating(msg.getRating());
        return repo.save(review);
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
                    ReviewMedia media = new ReviewMedia();
                    media.setType(file.getContentType().startsWith("video") ? MediaType.VIDEO : MediaType.IMAGE);

                    // Use UUID to avoid name collisions
                    String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
                    Path path = Paths.get(MEDIA_UPLOAD_DIR, filename);
                    Files.createDirectories(path.getParent()); // Ensure folder exists

                    // Save file
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

        return repo.save(review);
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
                Path path = Paths.get(MEDIA_UPLOAD_DIR, filename);
                Files.deleteIfExists(path);
            }
        }

        // Add new uploaded files
        if (newFiles != null && newFiles.length > 0) {
            for (MultipartFile file : newFiles) {
                ReviewMedia media = new ReviewMedia();
                media.setType(file.getContentType().startsWith("video") ? MediaType.VIDEO : MediaType.IMAGE);

                String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
                Path path = Paths.get(MEDIA_UPLOAD_DIR, filename);
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
            Path path = Paths.get(MEDIA_UPLOAD_DIR, filename);
            try {
                Files.deleteIfExists(path);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        // Clear media list to trigger orphanRemoval cascade delete
        review.getMediaList().clear();

        // Delete review entity
        repo.delete(review);
    }

}

