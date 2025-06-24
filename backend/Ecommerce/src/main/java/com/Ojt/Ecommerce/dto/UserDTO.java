package com.Ojt.Ecommerce.dto;

import com.Ojt.Ecommerce.entity.User;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
    private long roleId;  // Role id for reference
    private String roleName;  // Role name for convenience

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
        }
    }


}
