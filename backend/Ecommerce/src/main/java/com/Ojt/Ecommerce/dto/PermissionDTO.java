package com.Ojt.Ecommerce.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor  // Jackson ရဲ့ serialization/deserialization အတွက် လိုတယ်
@AllArgsConstructor // အပေါ် constructor ကို အလိုအလျောက် generate
public class PermissionDTO {
    private Long id;
    private String key;
    private String name;
    private String description;
    private String level;
    private Long categoryId;  // minimal info
}
