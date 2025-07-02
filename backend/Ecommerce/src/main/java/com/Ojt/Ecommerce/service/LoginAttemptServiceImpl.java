package com.Ojt.Ecommerce.service;


import com.Ojt.Ecommerce.dto.LoginAttemptDTO;
import com.Ojt.Ecommerce.dto.PagedResponse;
import com.Ojt.Ecommerce.entity.LoginAttempt;
import com.Ojt.Ecommerce.repository.LoginAttemptRepository;
import com.Ojt.Ecommerce.service.LoginAttemptService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoginAttemptServiceImpl implements LoginAttemptService {

    @Autowired
    private LoginAttemptRepository repository;

    @Autowired
    private ModelMapper modelMapper;

    private LoginAttemptDTO convertToDTO(LoginAttempt entity) {
        return modelMapper.map(entity, LoginAttemptDTO.class);
    }

    private LoginAttempt convertToEntity(LoginAttemptDTO dto) {
        return modelMapper.map(dto, LoginAttempt.class);
    }

    @Override
    public List<LoginAttemptDTO> getAllAttempts() {
        return repository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<LoginAttemptDTO> getByStatus(String status) {
        return repository.findByStatus(status)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<LoginAttemptDTO> getByThreatLevel(String level) {
        return repository.findByThreatLevel(level)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<LoginAttemptDTO> search(String keyword) {
        return repository
                .findByUsernameContainingIgnoreCaseOrIpAddressContainingIgnoreCaseOrLocationContainingIgnoreCase(
                        keyword, keyword, keyword)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<LoginAttemptDTO> getByTimeRange(LocalDateTime start, LocalDateTime end) {
        return repository.findByTimestampBetween(start, end)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void saveAttempt(LoginAttemptDTO dto) {
        LoginAttempt entity = convertToEntity(dto);
        repository.save(entity);
    }

    @Override
    public List<LoginAttemptDTO> filterAndSearch(String status, String threatLevel, String searchTerm,
                                                 LocalDateTime startDate, LocalDateTime endDate,
                                                 String sortBy, String direction) {
        List<LoginAttempt> attempts = repository.findAll(); // can optimize later

        return attempts.stream()
                .filter(a -> status == null || status.equalsIgnoreCase("all") || a.getStatus().equalsIgnoreCase(status))
                .filter(a -> threatLevel == null || a.getThreatLevel().equalsIgnoreCase(threatLevel))
                .filter(a -> searchTerm == null || (
                        a.getUsername().toLowerCase().contains(searchTerm.toLowerCase()) ||
                                a.getIpAddress().toLowerCase().contains(searchTerm.toLowerCase()) ||
                                (a.getLocation() != null && a.getLocation().toLowerCase().contains(searchTerm.toLowerCase()))
                ))
                .filter(a -> (startDate == null || !a.getTimestamp().isBefore(startDate)) &&
                        (endDate == null || !a.getTimestamp().isAfter(endDate)))
                .sorted((a, b) -> {
                    int compare;
                    switch (sortBy) {
                        case "username": compare = a.getUsername().compareToIgnoreCase(b.getUsername()); break;
                        case "ipAddress": compare = a.getIpAddress().compareToIgnoreCase(b.getIpAddress()); break;
                        default: compare = a.getTimestamp().compareTo(b.getTimestamp()); break;
                    }
                    return "desc".equalsIgnoreCase(direction) ? -compare : compare;
                })
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public PagedResponse<LoginAttemptDTO> getPagedAttempts(int page, int size, String sortBy, String direction,
                                                           String status, String threatLevel, String searchTerm) {
        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<LoginAttempt> attemptsPage = repository.findAll(pageable); // we'll make this dynamic later

        List<LoginAttemptDTO> content = attemptsPage.getContent()
                .stream()
                .filter(a -> status == null || status.equalsIgnoreCase("all") || a.getStatus().equalsIgnoreCase(status))
                .filter(a -> threatLevel == null || a.getThreatLevel().equalsIgnoreCase(threatLevel))
                .filter(a -> searchTerm == null || (
                        a.getUsername().toLowerCase().contains(searchTerm.toLowerCase()) ||
                                a.getIpAddress().toLowerCase().contains(searchTerm.toLowerCase()) ||
                                (a.getLocation() != null && a.getLocation().toLowerCase().contains(searchTerm.toLowerCase()))
                ))
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                content,
                attemptsPage.getNumber(),
                attemptsPage.getSize(),
                attemptsPage.getTotalElements(),
                attemptsPage.getTotalPages(),
                attemptsPage.isLast()
        );
    }

    @Override
    public void blockIP(String ip) {
        List<LoginAttempt> attempts = repository.findAll();
        attempts.stream()
                .filter(a -> a.getIpAddress().equals(ip))
                .forEach(a -> {
                    a.setBlocked(true);
                    repository.save(a);
                });
    }

    @Override
    public void whitelistIP(String ip) {
        List<LoginAttempt> attempts = repository.findAll();
        attempts.stream()
                .filter(a -> a.getIpAddress().equals(ip))
                .forEach(a -> {
                    a.setBlocked(false);
                    repository.save(a);
                });
    }

    @Override
    public void blockIPs(List<String> ipList) {
        List<LoginAttempt> attempts = repository.findAll();
        attempts.stream()
                .filter(a -> ipList.contains(a.getIpAddress()))
                .forEach(a -> {
                    a.setBlocked(true);
                    repository.save(a);
                });
    }

    @Override
    public boolean isBlockedIP(String ip) {
        return repository.findAll().stream()
                .anyMatch(a -> a.getIpAddress().equals(ip) && a.isBlocked());
    }







    //calculateThreatScore part
    public int calculateThreatScore(LoginAttemptDTO dto) {
        int score = 0;

        if ("failed".equalsIgnoreCase(dto.getStatus())) {
            score += 30;
        }

        if (dto.isVPN() || dto.isProxy()) {
            score += 25;
        }

        if (dto.getLocation() == null || dto.getLocation().isEmpty()) {
            score += 20;
        }

        if (dto.getAttemptCount() != null && dto.getAttemptCount() >= 5) {
            score += 15;
        }

        return Math.min(score, 100); // Max cap at 100
    }

    public String determineThreatLevel(int score) {
        if (score >= 80) return "critical";
        if (score >= 60) return "high";
        if (score >= 30) return "medium";
        return "low";
    }

}


