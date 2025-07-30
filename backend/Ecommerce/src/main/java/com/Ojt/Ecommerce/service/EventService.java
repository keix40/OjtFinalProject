package com.Ojt.Ecommerce.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.Ojt.Ecommerce.dto.EventDTO;

public interface EventService {
    EventDTO createEvent(EventDTO dto, MultipartFile imageFile);
    EventDTO updateEvent(Long id, EventDTO dto, MultipartFile imageFile);
    List<EventDTO> getAllEvents();
    EventDTO getEventById(Long id);
    Integer getMaxActiveSlideNo();
    Object deleteEvent(Long id);
    List<EventDTO> getActiveEventsForHero(); // New method for hero section
    void updateEventOrder(List<EventOrderUpdate> orderUpdates);

    class EventOrderUpdate {
        public Long id;
        public Integer slideNo;
    }
}