package com.Ojt.Ecommerce.service;


import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.Ojt.Ecommerce.dto.AddressDTO;
import com.Ojt.Ecommerce.entity.Address;
import com.Ojt.Ecommerce.entity.User;
import com.Ojt.Ecommerce.repository.AddressRepository;
import com.Ojt.Ecommerce.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService{

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;


    //add service (Kei_
    @Override
    public Long addNewAddress(AddressDTO dto){

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
        return address.getId();
    }

    @Override
    public List<AddressDTO> getAddressByUserId(Long userId){

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Address> addressList = addressRepository.findByUserAndStatus(user, 1);
        return addressList
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public AddressDTO convertToDTO(Address address) {

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

    @Override
    public com.Ojt.Ecommerce.entity.Address updateAddress(Long id, AddressDTO dto) {
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        // Optionally, check if userId matches the address's user
        if (dto.getUserId() != null && address.getUser() != null && !dto.getUserId().equals(address.getUser().getId())) {
            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            address.setUser(user);
        }

        address.setAddress(dto.getAddress());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setPostalCode(dto.getPostalCode());
        address.setCountry(dto.getCountry());
        address.setLatitude(dto.getLatitude());
        address.setLongitude(dto.getLongitude());
        address.setType(dto.getType());
        address.setUpdateDate(LocalDateTime.now());

        return addressRepository.save(address);
    }

    @Override
    public void deleteAddress(Long id) {
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Address not found"));
        address.setStatus(0);
        addressRepository.save(address);
    }
}
