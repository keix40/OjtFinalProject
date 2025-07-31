package com.Ojt.Ecommerce.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.Ojt.Ecommerce.dto.EventDTO;
import com.Ojt.Ecommerce.service.EventService;
import com.Ojt.Ecommerce.annotations.LogActivity;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final com.Ojt.Ecommerce.repository.EventRepository eventRepository;

    @LogActivity(actionType = "CREATE", entityType = "EVENT", description = "Created promotional event", severityLevel = "MEDIUM")
    @PostMapping("/create")
    public ResponseEntity<?> createEvent(@RequestPart("data") EventDTO eventDTO,
                                         @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        return ResponseEntity.ok(eventService.createEvent(eventDTO, imageFile));
    }

    @LogActivity(actionType = "UPDATE", entityType = "EVENT", description = "Updated promotional event", severityLevel = "MEDIUM", entityIdParam = "id", logChanges = true)
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id,
                                         @RequestPart("data") EventDTO eventDTO,
                                         @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        Object result = eventService.updateEvent(id, eventDTO, imageFile);
        // Ensure we return the actual Event entity for logging
        if (result instanceof com.Ojt.Ecommerce.entity.Events) {
            return ResponseEntity.ok(result);
        } else {
            // If service returns something else, fetch the updated entity
            com.Ojt.Ecommerce.entity.Events updatedEvent = eventRepository.findById(id).orElse(null);
            return ResponseEntity.ok(updatedEvent);
        }
    }

    @GetMapping("/list")
    public ResponseEntity<?> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @GetMapping("/next-slide-no")
    public Integer getNextSlideNo() {
        return eventService.getMaxActiveSlideNo();
    }

    @GetMapping("/hero")
    public List<EventDTO> getActiveEventsForHero() {
        return eventService.getActiveEventsForHero();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    @LogActivity(actionType = "DELETE", entityType = "EVENT", description = "", severityLevel = "HIGH", entityIdParam = "id")
    @PutMapping("/delete/{id}")
    public Object deleteEvent(@PathVariable Long id) {
        return eventService.deleteEvent(id);
    }

    @PostMapping("/update-order")
    public ResponseEntity<?> updateEventOrder(@org.springframework.web.bind.annotation.RequestBody List<com.Ojt.Ecommerce.service.EventService.EventOrderUpdate> orderUpdates) {
        eventService.updateEventOrder(orderUpdates);
        return ResponseEntity.ok().build();
    }
}