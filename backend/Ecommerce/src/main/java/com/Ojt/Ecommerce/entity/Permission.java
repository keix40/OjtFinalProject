package com.Ojt.Ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "permission")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false, unique = true)
    private String key; // ✅ key like "users.view"

    @Column(length = 100, nullable = false)
    private String name; // ✅ name like "View"

    @Column(length = 255)
    private String description;

    @Column(length = 30)
    private String level; // e.g., basic, intermediate, critical


    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "permission_category_id") // Foreign key to category
    private PermissionCategory permissionCategory;

    @OneToMany(mappedBy = "permission", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<RolePermission> rolePermissions;

    public Permission(String key, String name, String description, String level, PermissionCategory category) {
        this.key = key;
        this.name = name;
        this.description = description;
        this.level = level;
        this.permissionCategory = category;
    }

}


