package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.AddressDTO;

import java.util.List;

public interface AddressService {
    String addNewAddress(AddressDTO dto);
    List<AddressDTO> getAddressByUserId(Long userId);


}
