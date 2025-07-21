package com.Ojt.Ecommerce.service;

import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Ojt.Ecommerce.dto.AddressDTO;
import com.Ojt.Ecommerce.dto.DeliveryServiceDTO;
import com.Ojt.Ecommerce.entity.Address;
import com.Ojt.Ecommerce.entity.DeliveryMethod;
import com.Ojt.Ecommerce.repository.AddressRepository;
import com.Ojt.Ecommerce.repository.DeliveryMethodRepository;
import com.Ojt.Ecommerce.repository.DeliveryServiceRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    @Autowired
    private ModelMapper mapper;

    @Autowired
    private DeliveryMethodRepository repo;

    private final DeliveryServiceRepository deliveryServiceRepo;

    @Autowired
    private AddressRepository addressRepo;

    @Autowired
    private DistanceCalculatorService distanceService;

    public List<DeliveryMethod> findAllDelivery(){
        return repo.findAll();
    }

    public List<DeliveryServiceDTO> getAll() {
        return deliveryServiceRepo.findByStatus(1).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public DeliveryServiceDTO getById(Long id) {
        com.Ojt.Ecommerce.entity.DeliveryService entity = deliveryServiceRepo.findByIdAndStatus(id, 1)
                .orElseThrow(() -> new EntityNotFoundException("Delivery service not found"));
        return convertToDTO(entity);
    }


    public DeliveryServiceDTO create(DeliveryServiceDTO dto) {
        com.Ojt.Ecommerce.entity.DeliveryService entity = new com.Ojt.Ecommerce.entity.DeliveryService();
        entity.setName(dto.getName());
        entity.setFeePerKm(dto.getFeePerKm());
        entity.setStatus(1);
        entity.setPhoneNumber(dto.getPhoneNumber());

        if (dto.getBaseAddress() != null && dto.getBaseAddress().getId() != null) {
            Address managedAddress = addressRepo.findById(dto.getBaseAddress().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Base address not found"));
            entity.setBaseAddress(managedAddress);
        }

        com.Ojt.Ecommerce.entity.DeliveryService saved = deliveryServiceRepo.save(entity);
        return convertToDTO(saved);
    }

    public DeliveryServiceDTO update(Long id, DeliveryServiceDTO updatedDto) {
        // 1. Fetch the entity, not DTO
        com.Ojt.Ecommerce.entity.DeliveryService existing = deliveryServiceRepo.findByIdAndStatus(id, 1)
                .orElseThrow(() -> new EntityNotFoundException("Delivery service not found"));

        // 2. Update the entity fields
        existing.setName(updatedDto.getName());
        existing.setFeePerKm(updatedDto.getFeePerKm());
        existing.setPhoneNumber(updatedDto.getPhoneNumber());

        // 3. Update the base address if provided
        AddressDTO baseAddressDto = updatedDto.getBaseAddress();
        if (baseAddressDto != null && baseAddressDto.getId() != null) {
            Address managedAddress = addressRepo.findById(baseAddressDto.getId())
                    .orElseThrow(() -> new EntityNotFoundException("Base address not found"));
            existing.setBaseAddress(managedAddress);
        }

        // 4. Save and return the updated DTO
        com.Ojt.Ecommerce.entity.DeliveryService saved = deliveryServiceRepo.save(existing);
        return convertToDTO(saved);
    }

    private DeliveryServiceDTO convertToDTO(com.Ojt.Ecommerce.entity.DeliveryService entity) {
        DeliveryServiceDTO dto = new DeliveryServiceDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setFeePerKm(entity.getFeePerKm());
        dto.setPhoneNumber(entity.getPhoneNumber());

        if (entity.getBaseAddress() != null) {
            dto.setBaseAddress(convertToAddressDTO(entity.getBaseAddress()));
        }
        return dto;
    }

    private AddressDTO convertToAddressDTO(Address address) {
        AddressDTO dto = new AddressDTO();
        dto.setId(address.getId());
        dto.setAddress(address.getAddress());
        dto.setCity(address.getCity());
        dto.setState(address.getState());
        dto.setPostalCode(address.getPostalCode());
        dto.setCountry(address.getCountry());
        dto.setLatitude(address.getLatitude());
        dto.setLongitude(address.getLongitude());
        // Optionally include type and userId if needed
        return dto;
    }

    public void softDelete(Long id) {
        com.Ojt.Ecommerce.entity.DeliveryService deliveryService = deliveryServiceRepo.findByIdAndStatus(id, 1)
                        .orElseThrow(() -> new EntityNotFoundException("Delivery Entity not found"));
        deliveryService.setStatus(0); // soft delete
        deliveryServiceRepo.save(deliveryService);
    }

    public double calculateFeeByDistance(Long deliveryServiceId, Long addressId) {
        // Get delivery service entity safely
        com.Ojt.Ecommerce.entity.DeliveryService deliveryEntity = deliveryServiceRepo.findByIdAndStatus(deliveryServiceId, 1)
                .orElseThrow(() -> new EntityNotFoundException("Delivery service not found or inactive"));

        Address baseAddress = deliveryEntity.getBaseAddress();

        Address userAddress = addressRepo.findById(addressId)
                .orElseThrow(() -> new EntityNotFoundException("User address not found"));

        if (baseAddress == null) {
            throw new IllegalArgumentException("Base address not configured for the delivery service.");
        }

        // Check for missing coordinates
        if (baseAddress.getLatitude() == null || baseAddress.getLongitude() == null ||
                userAddress.getLatitude() == null || userAddress.getLongitude() == null) {
            throw new IllegalArgumentException("Latitude or longitude missing in base/user address.");
        }

        double lat1 = baseAddress.getLatitude().doubleValue();
        double lon1 = baseAddress.getLongitude().doubleValue();
        double lat2 = userAddress.getLatitude().doubleValue();
        double lon2 = userAddress.getLongitude().doubleValue();

        // Calculate distance and fee
        double distanceKm = distanceService.calculateDistance(lat1, lon1, lat2, lon2);
        double deliveryFee = distanceKm * deliveryEntity.getFeePerKm().doubleValue();

        // Round to nearest integer (no decimals)
        return Math.round(deliveryFee);
    }
}
