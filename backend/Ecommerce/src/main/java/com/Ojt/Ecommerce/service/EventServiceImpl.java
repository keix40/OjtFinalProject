package com.Ojt.Ecommerce.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.Ojt.Ecommerce.dto.EventDTO;
import com.Ojt.Ecommerce.entity.Discount;
import com.Ojt.Ecommerce.entity.EventProduct;
import com.Ojt.Ecommerce.entity.Events;
import com.Ojt.Ecommerce.entity.Product;
import com.Ojt.Ecommerce.repository.DiscountRepository;
import com.Ojt.Ecommerce.repository.EventProductRepository;
import com.Ojt.Ecommerce.repository.EventRepository;
import com.Ojt.Ecommerce.repository.ProductRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {
    private static final Logger log = LoggerFactory.getLogger(EventServiceImpl.class);

    private final EventRepository eventRepository;
    private final ProductRepository productRepository;
    private final DiscountRepository discountRepository;
    private final EventProductRepository eventProductRepository;

    private final String uploadDir = "event";

    @Override
    @Transactional
    public EventDTO createEvent(EventDTO dto, MultipartFile imageFile) {
        // Validate name uniqueness (case-insensitive)
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Event name is required.");
        }
        if (eventRepository.findByNameIgnoreCaseAndStatus(dto.getName().trim(), 1).isPresent()) {
            throw new IllegalArgumentException("Event name already exists.");
        }

        // Validate slideNo
        Integer slideNo = dto.getSlideNo();
        if (slideNo == null || slideNo < 1) {
            Integer maxSlideNo = eventRepository.findMaxActiveSlideNo();
            slideNo = (maxSlideNo == null) ? 1 : maxSlideNo + 1;
        }

        Events event = new Events();
        event.setName(dto.getName());
        event.setDescription(dto.getDescription());
        event.setSlideNo(slideNo);
        event.setStartDate(dto.getStartDate());
        event.setEndDate(dto.getEndDate());

        event.setIsDefault(dto.getIsDefault() != null ? dto.getIsDefault() : 0);
        event.setStatus(resolveStatus(dto.getStatus(), dto.getStartDate()));

        if (dto.getDiscountId() != null) {
            Discount discount = discountRepository.findById(dto.getDiscountId()).orElse(null);
            event.setDiscount(discount);
        }

        if (imageFile != null && !imageFile.isEmpty()) {
            String imagePath = saveImage(imageFile);
            event.setEventImage("/event/" + imagePath);
        }

        Events saved = eventRepository.save(event);

        if (dto.getDiscountId() == null && dto.getProductIds() != null) {
            for (Long productId : dto.getProductIds()) {
                Product product = productRepository.findById(productId).orElse(null);
                if (product != null) {
                    eventProductRepository.save(EventProduct.builder()
                            .events(saved)
                            .product(product)
                            .build());
                }
            }
        }

        List<Long> productIds = saved.getEventProduct() != null
            ? saved.getEventProduct().stream().map(ep -> ep.getProduct().getId()).collect(Collectors.toList())
            : new java.util.ArrayList<>();
        return EventDTO.builder()
            .id(saved.getId())
            .name(saved.getName())
            .description(saved.getDescription())
            .slideNo(saved.getSlideNo())
            .startDate(saved.getStartDate())
            .endDate(saved.getEndDate())
            .isDefault(saved.getIsDefault())
            .status(saved.getStatus())
            .eventImage(saved.getEventImage())
            .discountId(saved.getDiscount() != null ? saved.getDiscount().getId() : null)
            .productIds(productIds)
            .build();
    }

    @Override
    @Transactional
    public EventDTO updateEvent(Long id, EventDTO dto, MultipartFile imageFile) {
        try {
            log.info("Updating event with id {}: DTO = {}", id, dto);
            Events event = eventRepository.findById(id).orElseThrow();
            // Check if event is not deleted
            if (event.getStatus() != null && event.getStatus() == 2) {
                throw new RuntimeException("Event not found or has been deleted");
            }

            // Validate name uniqueness (case-insensitive, allow same for self)
            if (dto.getName() == null || dto.getName().trim().isEmpty()) {
                throw new IllegalArgumentException("Event name is required.");
            }
            eventRepository.findByNameIgnoreCaseAndStatus(dto.getName().trim(), 1)
                .filter(e -> !e.getId().equals(id))
                .ifPresent(e -> { throw new IllegalArgumentException("Event name already exists."); });

            // Validate slideNo (must be >= 1)
            Integer slideNo = dto.getSlideNo();
            if (slideNo == null || slideNo < 1) {
                Integer maxSlideNo = eventRepository.findMaxActiveSlideNo();
                slideNo = (maxSlideNo == null) ? 1 : maxSlideNo + 1;
            }

            event.setName(dto.getName());
            event.setDescription(dto.getDescription());
            event.setSlideNo(slideNo);
            event.setStartDate(dto.getStartDate());
            event.setEndDate(dto.getEndDate());
            event.setIsDefault(dto.getIsDefault() != null ? dto.getIsDefault() : 0);
            // If this event is being set as default, unset all other events as default
            if (dto.getIsDefault() != null && dto.getIsDefault() == 1) {
                List<Events> allEvents = eventRepository.findAll();
                for (Events existingEvent : allEvents) {
                    if (!existingEvent.getId().equals(event.getId())) {
                        existingEvent.setIsDefault(0);
                        eventRepository.save(existingEvent);
                    }
                }
            }
            event.setStatus(resolveStatus(dto.getStatus(), dto.getStartDate()));

            if (dto.getDiscountId() != null) {
                Discount discount = discountRepository.findById(dto.getDiscountId()).orElse(null);
                event.setDiscount(discount);
            } else {
                event.setDiscount(null);
            }

            if (imageFile != null && !imageFile.isEmpty()) {
                String imagePath = saveImage(imageFile);
                event.setEventImage("/event/" + imagePath);
            }

            eventProductRepository.deleteByEvents(event);
            if (dto.getDiscountId() == null && dto.getProductIds() != null) {
                for (Long productId : dto.getProductIds()) {
                    Product product = productRepository.findById(productId).orElse(null);
                    if (product != null) {
                        eventProductRepository.save(EventProduct.builder()
                                .events(event)
                                .product(product)
                                .build());
                    }
                }
            }

            Events saved = eventRepository.save(event);
            // Map to DTO
            List<Long> productIds = saved.getEventProduct() != null
                ? saved.getEventProduct().stream().map(ep -> ep.getProduct().getId()).collect(Collectors.toList())
                : new java.util.ArrayList<>();
            return EventDTO.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .slideNo(saved.getSlideNo())
                .startDate(saved.getStartDate())
                .endDate(saved.getEndDate())
                .isDefault(saved.getIsDefault())
                .status(saved.getStatus())
                .eventImage(saved.getEventImage())
                .discountId(saved.getDiscount() != null ? saved.getDiscount().getId() : null)
                .productIds(productIds)
                .build();
        } catch (Exception e) {
            log.error("Error updating event: ", e);
            throw new RuntimeException("Failed to update event: " + e.getMessage(), e);
        }
    }

    @Override
    public List<EventDTO> getAllEvents() {
        List<Events> events = eventRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        // Auto-update status to inactive if endDate is before now
        for (Events event : events) {
            if (event.getStatus() != null && event.getStatus() == 1 && event.getEndDate() != null && event.getEndDate().isBefore(now)) {
                event.setStatus(0);
                eventRepository.save(event);
            }
        }
        return events.stream()
            .filter(event -> event.getStatus() != null && event.getStatus() != 2) // Exclude deleted events (status = 2)
            .map(event -> {
            List<Long> productIds = event.getEventProduct() != null
                ? event.getEventProduct().stream().map(ep -> ep.getProduct().getId()).collect(Collectors.toList())
                : new java.util.ArrayList<>();
            return EventDTO.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .slideNo(event.getSlideNo())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .isDefault(event.getIsDefault())
                .status(event.getStatus())
                .eventImage(event.getEventImage())
                .discountId(event.getDiscount() != null ? event.getDiscount().getId() : null)
                .productIds(productIds)
                .build();
        }).collect(Collectors.toList());
    }

    @Override
    public EventDTO getEventById(Long id) {
        Events event = eventRepository.findById(id).orElseThrow();
        // Check if event is not deleted
        if (event.getStatus() != null && event.getStatus() == 2) {
            throw new RuntimeException("Event not found or has been deleted");
        }
        List<Long> productIds = event.getEventProduct() != null
            ? event.getEventProduct().stream().map(ep -> ep.getProduct().getId()).collect(Collectors.toList())
            : new java.util.ArrayList<>();
        return EventDTO.builder()
            .id(event.getId())
            .name(event.getName())
            .description(event.getDescription())
            .slideNo(event.getSlideNo())
            .startDate(event.getStartDate())
            .endDate(event.getEndDate())
            .isDefault(event.getIsDefault())
            .status(event.getStatus())
            .eventImage(event.getEventImage())
            .discountId(event.getDiscount() != null ? event.getDiscount().getId() : null)
            .productIds(productIds)
            .build();
    }

    @Override
    public Integer getMaxActiveSlideNo() {
        return eventRepository.findMaxActiveSlideNo();
    }

    @Override
    public List<EventDTO> getActiveEventsForHero() {
        List<Events> allEvents = eventRepository.findAll();
        List<EventDTO> heroEvents = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        log.info("[EventService] Getting active events for hero. Current time: {}", now);
        log.info("[EventService] Total events in database: {}", allEvents.size());
        
        // First, try to get non-default active events
        // Include events that are:
        // 1. Status = 1 (active)
        // 2. Not default (isDefault != 1)
        // 3. Haven't ended yet (endDate >= now) - show future events too
        List<Events> nonDefaultActiveEvents = allEvents.stream()
            .filter(event -> {
                boolean statusOk = event.getStatus() == 1;
                boolean notDefault = event.getIsDefault() != 1;
                boolean notEnded = !now.isAfter(event.getEndDate());
                boolean isActive = statusOk && notDefault && notEnded;
                log.info("[EventService] Event '{}': status={}, notDefault={}, notEnded={}, isActive={}, startDate={}, endDate={}", 
                    event.getName(), statusOk, notDefault, notEnded, isActive, event.getStartDate(), event.getEndDate());
                return isActive;
            })
            .sorted(Comparator.comparing(Events::getSlideNo))
            .collect(Collectors.toList());
        
        log.info("[EventService] Non-default active events found: {}", nonDefaultActiveEvents.size());
        
        // If no non-default active events exist, get default events
        // Include events that are:
        // 1. Status = 1 (active)
        // 2. Is default (isDefault == 1)
        // 3. Haven't ended yet (endDate >= now) - show future events too
        List<Events> eventsToUse = nonDefaultActiveEvents.isEmpty() ? 
            allEvents.stream()
                .filter(event -> {
                    boolean statusOk = event.getStatus() == 1;
                    boolean isDefault = event.getIsDefault() == 1;
                    boolean notEnded = !now.isAfter(event.getEndDate());
                    boolean isActive = statusOk && isDefault && notEnded;
                    log.info("[EventService] Default Event '{}': status={}, isDefault={}, notEnded={}, isActive={}, startDate={}, endDate={}", 
                        event.getName(), statusOk, isDefault, notEnded, isActive, event.getStartDate(), event.getEndDate());
                    return isActive;
                })
                .sorted(Comparator.comparing(Events::getSlideNo))
                .collect(Collectors.toList()) : 
            nonDefaultActiveEvents;
        
        log.info("[EventService] Events to use for hero: {}", eventsToUse.size());
        
        // Convert to DTOs
        for (Events event : eventsToUse) {
            List<Long> productIds = event.getEventProduct() != null
                ? event.getEventProduct().stream().map(ep -> ep.getProduct().getId()).collect(Collectors.toList())
                : new java.util.ArrayList<>();
            
            Long discountId = event.getDiscount() != null ? event.getDiscount().getId() : null;
            
            EventDTO dto = EventDTO.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .slideNo(event.getSlideNo())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .isDefault(event.getIsDefault())
                .status(event.getStatus())
                .eventImage(event.getEventImage())
                .discountId(discountId)
                .productIds(productIds)
                .build();
            log.info("[EventService] Adding event to hero list: {}", dto.getName());
            heroEvents.add(dto);
        }
        
        log.info("[EventService] Returning {} hero events", heroEvents.size());
        return heroEvents;
    }

    @Override
    @Transactional
    public Object deleteEvent(Long id) {
        Events event = eventRepository.findById(id).orElseThrow();
        // Check if event is not already deleted
        if (event.getStatus() != null && event.getStatus() == 2) {
            throw new RuntimeException("Event is already deleted");
        }
        event.setStatus(2); // Soft delete - set status to 2
        return eventRepository.save(event);
    }

    @Override
    @Transactional
    public void updateEventOrder(List<EventService.EventOrderUpdate> orderUpdates) {
        for (EventService.EventOrderUpdate update : orderUpdates) {
            Events event = eventRepository.findById(update.id).orElse(null);
            if (event != null) {
                event.setSlideNo(update.slideNo);
                eventRepository.save(event);
            }
        }
    }

    private Integer resolveStatus(Integer status, LocalDateTime startDate) {
        if (status != null) return status;
        return LocalDateTime.now().toLocalDate().equals(startDate.toLocalDate()) ? 1 : 0;
    }

    private String saveImage(MultipartFile file) {
        try {
            File folder = new File(uploadDir);
            if (!folder.exists()) folder.mkdirs();
            String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filepath = Paths.get(uploadDir, filename);
            Files.write(filepath, file.getBytes());
            return filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }
}