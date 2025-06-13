package com.Ojt.Ecommerce.controller;


import com.Ojt.Ecommerce.dto.AddressDTO;
import com.Ojt.Ecommerce.entity.Address;
import com.Ojt.Ecommerce.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressService addressService;


    //add controller method (Kei_)
    @PostMapping("/addNewAddress")
    public ResponseEntity<?> addNewAddress(@RequestBody AddressDTO dto) {
        String result = addressService.addNewAddress(dto);
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


}
