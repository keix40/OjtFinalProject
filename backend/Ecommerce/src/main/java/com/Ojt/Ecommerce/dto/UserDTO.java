package com.Ojt.Ecommerce.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private LocalDate dob;
    private String gender;
    private String phNo;
    private LocalDateTime createdDate;
    private Integer totalPoints;
}
