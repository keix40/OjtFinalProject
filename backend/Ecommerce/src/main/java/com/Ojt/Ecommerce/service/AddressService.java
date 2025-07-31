package com.Ojt.Ecommerce.service;

import java.util.List;

import com.Ojt.Ecommerce.dto.AddressDTO;

public interface AddressService {
    Long addNewAddress(AddressDTO dto);
    List<AddressDTO> getAddressByUserId(Long userId);
    com.Ojt.Ecommerce.entity.Address updateAddress(Long id, AddressDTO dto);
    void deleteAddress(Long id);
    AddressDTO convertToDTO(com.Ojt.Ecommerce.entity.Address address);
}
