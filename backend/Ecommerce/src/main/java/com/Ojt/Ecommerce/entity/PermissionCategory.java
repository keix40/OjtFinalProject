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

    @Column(name = "`key`", unique = true, nullable = false)
    private String key;

    @Column(name = "`name`", nullable = false)
    private String name;

    private String icon;

    @OneToMany(mappedBy = "permissionCategory", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<Permission> permissions = new ArrayList<>();

    public PermissionCategory(String key, String name, String icon) {
        this.key = key;
        this.name = name;
        this.icon = icon;
    }
}
