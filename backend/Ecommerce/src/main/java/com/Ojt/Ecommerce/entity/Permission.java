package com.Ojt.Ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String name;

    @OneToMany(mappedBy = "permission", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<RolePermission> rolePermissions;

    @ManyToOne
    @JoinColumn(name = "permission_category_id") // Column in 'permission' table
    private PermissionCategory permissionCategory;
}
