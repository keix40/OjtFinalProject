package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.entity.Address;
import com.Ojt.Ecommerce.entity.AddressType;
import com.Ojt.Ecommerce.entity.DeliveryService;
import com.Ojt.Ecommerce.repository.DeliveryServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliveryServiceSeedService {

    private final DeliveryServiceRepository deliveryServiceRepository;

    @Transactional
    public void seedDefaultsIfEmpty() {
        if (deliveryServiceRepository.count() > 0) {
            return;
        }

        List<SeedDelivery> seeds = List.of(
                new SeedDelivery("Royal Express", "09248102838", new BigDecimal("100.00"),
                        "No. 1, Pyay Road", "Yangon", "Yangon Region", "11181", "Myanmar",
                        new BigDecimal("16.866069"), new BigDecimal("96.195132")),
                new SeedDelivery("Fast Delivery", "094029138830", new BigDecimal("100.00"),
                        "Mandalay Central", "Mandalay", "Mandalay Region", "05011", "Myanmar",
                        new BigDecimal("21.958828"), new BigDecimal("96.089104")),
                new SeedDelivery("BEE Delivery", "094203849291", new BigDecimal("100.00"),
                        "Nay Pyi Taw Main Road", "Nay Pyi Taw", "Nay Pyi Taw", "15011", "Myanmar",
                        new BigDecimal("19.763306"), new BigDecimal("96.078506"))
        );

        for (SeedDelivery seed : seeds) {
            Address address = Address.builder()
                    .address(seed.addressLine())
                    .city(seed.city())
                    .state(seed.state())
                    .postalCode(seed.postalCode())
                    .country(seed.country())
                    .latitude(seed.latitude())
                    .longitude(seed.longitude())
                    .type(AddressType.SHIPPING)
                    .build();

            DeliveryService service = DeliveryService.builder()
                    .name(seed.name())
                    .phoneNumber(seed.phone())
                    .feePerKm(seed.feePerKm())
                    .baseAddress(address)
                    .status(1)
                    .build();

            deliveryServiceRepository.save(service);
        }

        System.out.println("Seeded default delivery services (table was empty).");
    }

    private record SeedDelivery(
            String name,
            String phone,
            BigDecimal feePerKm,
            String addressLine,
            String city,
            String state,
            String postalCode,
            String country,
            BigDecimal latitude,
            BigDecimal longitude
    ) {}
}
