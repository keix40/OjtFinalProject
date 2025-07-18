package com.Ojt.Ecommerce.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Ojt.Ecommerce.entity.Address;
import com.Ojt.Ecommerce.entity.User;


//add repo of address(Kei_
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUserAndStatus(User user, Integer status);

}
