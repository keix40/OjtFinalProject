package com.Ojt.Ecommerce.dto;

import lombok.Getter;
import lombok.Setter;
import com.Ojt.Ecommerce.entity.User;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class UserDTO {

    private long id;
    private String name;
    private String email;
    private String profileImage;
    private String gender;
    private LocalDate dateOfBirth;
    private String phoneNumber;
    private boolean verified;
    private LocalDateTime createdDate;
    private Integer totalPoints;
    private long roleId;  // Role id for reference
    private String roleName;  // Role name for convenience
    private String password;
    private String status;
    private LocalDateTime lastLogin;
    private List<String> permissions;

    // Constructor to map from entity to DTO
    public UserDTO(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.profileImage = user.getProfileImage();
        this.gender = user.getGender();
        this.dateOfBirth = user.getDateOfBirth();
        this.phoneNumber = user.getPhoneNumber();
        this.verified = user.isVerified();
        this.createdDate = user.getCreatedDate();
        if (user.getRole() != null) {
            this.roleId = user.getRole().getId();
            this.roleName = user.getRole().getName();
            this.permissions = user.getRole().getRolePermissions() != null ?
                user.getRole().getRolePermissions().stream()
                    .map(rp -> rp.getPermission().getKey())
                    .collect(Collectors.toList()) : null;
        } else {
            this.permissions = null;
        }
        this.status = user.getStatus() != null ? user.getStatus().name().toLowerCase() : null;
        this.lastLogin = user.getLastLogin();
    }


}
