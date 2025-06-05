package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Address;
import com.Ojt.Ecommerce.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


//add repo of address(Kei_
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUser(User user);

}
