package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "permission_category")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class PermissionCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String key;

    @Column(nullable = false)
    private String name;

    private String icon;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    private List<Permission> permissions = new ArrayList<>();

    // Getters, Setters, Constructors
}
