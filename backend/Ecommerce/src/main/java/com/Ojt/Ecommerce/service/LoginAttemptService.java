package com.Ojt.Ecommerce.service;



import com.Ojt.Ecommerce.dto.LoginAttemptDTO;
import com.Ojt.Ecommerce.dto.PagedResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface LoginAttemptService {
    List<LoginAttemptDTO> getAllAttempts();
    List<LoginAttemptDTO> getByStatus(String status);
    List<LoginAttemptDTO> getByThreatLevel(String level);
    List<LoginAttemptDTO> search(String keyword);
    List<LoginAttemptDTO> getByTimeRange(LocalDateTime start, LocalDateTime end);
    void saveAttempt(LoginAttemptDTO dto);
    List<LoginAttemptDTO> filterAndSearch(
            String status,
            String threatLevel,
            String searchTerm,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String sortBy,
            String direction
    );

    PagedResponse<LoginAttemptDTO> getPagedAttempts(
            int page,
            int size,
            String sortBy,
            String direction,
            String status,
            String threatLevel,
            String searchTerm
    );

    void blockIP(String ip);
    void whitelistIP(String ip);
    void blockIPs(List<String> ipList);
    boolean isBlockedIP(String ip);
    int calculateThreatScore(LoginAttemptDTO dto);
    String determineThreatLevel(int score);
    int calculateRecentAttemptCount(String ipAddress, LocalDateTime now);
    LoginAttemptDTO enrichAttemptWithStats(LoginAttemptDTO dto);


}
