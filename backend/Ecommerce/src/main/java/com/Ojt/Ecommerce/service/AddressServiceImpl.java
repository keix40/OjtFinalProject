package com.Ojt.Ecommerce.service;


import com.Ojt.Ecommerce.dto.AddressDTO;
import com.Ojt.Ecommerce.entity.Address;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.repository.AddressRepository;
import com.Ojt.Ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService{

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;


    //add service (Kei_
    @Override
    public String addNewAddress(AddressDTO dto){

        User user = userRepository.findById(dto.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));

        Address address = Address.builder()
                .address(dto.getAddress())
                .city(dto.getCity())
                .state(dto.getState())
                .postalCode(dto.getPostalCode())
                .country(dto.getCountry())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .type(dto.getType())
                .user(user)
                .createUpdate(LocalDateTime.now())
                .updateDate(LocalDateTime.now())
                .build();

        addressRepository.save(address);
        return "Address saved successfully.";

    }

    @Override
    public List<AddressDTO> getAddressByUserId(Long userId){

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));


        List<Address> addressList = addressRepository.findByUser(user);
        return addressList
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private AddressDTO convertToDTO(Address address) {

        AddressDTO dto = new AddressDTO();
        dto.setId(address.getId());
        dto.setAddress(address.getAddress());
        dto.setCountry(address.getCountry());
        dto.setCity(address.getCity());
        dto.setState(address.getState());
        dto.setPostalCode(address.getPostalCode());
        dto.setCreateUpdate(address.getCreateUpdate());
        dto.setUpdateDate(address.getUpdateDate());
        dto.setType(address.getType());
        dto.setUserId(address.getUser().getId());
        dto.setLatitude(address.getLatitude());
        dto.setLongitude(address.getLongitude());
        return dto;
    }

}
