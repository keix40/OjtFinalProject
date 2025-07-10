package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnRequestImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Path or URL to the image
    @Column(nullable = false)
    private String imageUrl;

    @ManyToOne
    @JoinColumn(name = "return_request_id", nullable = false)
    private ReturnRequest returnRequest;
}