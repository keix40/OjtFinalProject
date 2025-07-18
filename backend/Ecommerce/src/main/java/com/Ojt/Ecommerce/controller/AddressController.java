package com.Ojt.Ecommerce.controller;


import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Ojt.Ecommerce.dto.AddressDTO;
import com.Ojt.Ecommerce.service.AddressService;

import lombok.RequiredArgsConstructor;

@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressService addressService;


    //add controller method (Kei_)
    @PostMapping("/addNewAddress")
    public ResponseEntity<?> addNewAddress(@RequestBody AddressDTO dto) {
        Long result = addressService.addNewAddress(dto);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/showAddressList/{userId}")
    public ResponseEntity<List<AddressDTO>> getAllAddress(@PathVariable Long userId) {
        List<AddressDTO> addressList = addressService.getAddressByUserId(userId);
        if (addressList.isEmpty()) {
            return ResponseEntity.noContent().build(); // 204 No Content
        }
        return ResponseEntity.ok(addressList); // 200 OK
    }

    @PutMapping("/updateAddress/{id}")
    public ResponseEntity<?> updateAddress(@PathVariable Long id, @RequestBody AddressDTO dto) {
        Long result = addressService.updateAddress(id, dto);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/deleteAddress/{id}")
    public ResponseEntity<?> deleteAddress(@PathVariable Long id) {
        addressService.deleteAddress(id);
        return ResponseEntity.noContent().build();
    }

}
