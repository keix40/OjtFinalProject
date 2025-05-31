package com.Ojt.Ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "attribute")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attribute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 15)
    private String name;
}
