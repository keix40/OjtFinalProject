package com.Ojt.Ecommerce.service;


import com.Ojt.Ecommerce.dto.LoginAttemptDTO;
import com.Ojt.Ecommerce.dto.PagedResponse;
import com.Ojt.Ecommerce.entity.LoginAttempt;
import com.Ojt.Ecommerce.entity.BlockedIP;
import com.Ojt.Ecommerce.repository.LoginAttemptRepository;
import com.Ojt.Ecommerce.repository.BlockedIPRepository;
import com.Ojt.Ecommerce.service.LoginAttemptService;
import com.Ojt.Ecommerce.service.EmailService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LoginAttemptServiceImpl implements LoginAttemptService {

    @Autowired
    private LoginAttemptRepository repository;

    @Autowired
    private BlockedIPRepository blockedIPRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ModelMapper modelMapper;

    private static final int BLOCK_MINUTES = 15;

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
    @Transactional
    public void blockIP(String ip) {
        System.out.println("Blocking IP in service: " + ip);
        // Block in login attempts (legacy, for UI)
        List<LoginAttempt> attempts = repository.findAll();
        attempts.stream()
                .filter(a -> a.getIpAddress().equals(ip))
                .forEach(a -> {
                    a.setBlocked(true);
                    repository.save(a);
                });
        // Block in BlockedIP table
        LocalDateTime blockedUntil = LocalDateTime.now().plusMinutes(BLOCK_MINUTES);
        Optional<BlockedIP> existing = blockedIPRepository.findByIpAddress(ip);
        String userEmail = attempts.stream().filter(a -> a.getIpAddress().equals(ip) && a.getUsername() != null).map(LoginAttempt::getUsername).findFirst().orElse(null);
        if (existing.isPresent()) {
            BlockedIP block = existing.get();
            block.setBlockedUntil(blockedUntil);
            blockedIPRepository.save(block);
            System.out.println("Updated existing BlockedIP for: " + ip);
        } else {
            BlockedIP block = BlockedIP.builder()
                    .ipAddress(ip)
                    .blockedUntil(blockedUntil)
                    .userEmail(userEmail)
                    .reason("Manual block or threat detected")
                    .build();
            blockedIPRepository.save(block);
            System.out.println("Created new BlockedIP for: " + ip);
        }
        // Send alert email if userEmail is available
        if (userEmail != null && !userEmail.isEmpty()) {
            emailService.sendEmail(userEmail, "Security Alert: IP Blocked", "Your IP (" + ip + ") has been blocked for 15 minutes due to suspicious activity or manual action. If this was not you, please contact support.");
        }
    }

    public boolean isIPBlocked(String ip) {
        // Remove expired blocks
        blockedIPRepository.findByBlockedUntilBefore(LocalDateTime.now()).forEach(blockedIPRepository::delete);
        Optional<BlockedIP> block = blockedIPRepository.findByIpAddress(ip);
        return block.isPresent() && block.get().getBlockedUntil().isAfter(LocalDateTime.now());
    }

    public LocalDateTime getBlockedUntil(String ip) {
        Optional<BlockedIP> block = blockedIPRepository.findByIpAddress(ip);
        return block.map(BlockedIP::getBlockedUntil).orElse(null);
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

    @Override
    public List<LoginAttemptDTO> getBySessionId(String sessionId) {
        return repository.findAll().stream()
                .filter(a -> sessionId != null && sessionId.equals(a.getSessionId()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void blockSession(String sessionId) {
        List<LoginAttempt> attempts = repository.findAll();
        attempts.stream()
                .filter(a -> sessionId != null && sessionId.equals(a.getSessionId()))
                .forEach(a -> {
                    a.setBlocked(true);
                    repository.save(a);
                });
    }

    @Override
    public void whitelistSession(String sessionId) {
        List<LoginAttempt> attempts = repository.findAll();
        attempts.stream()
                .filter(a -> sessionId != null && sessionId.equals(a.getSessionId()))
                .forEach(a -> {
                    a.setBlocked(false);
                    repository.save(a);
                });
    }

    @Override
    public int calculateRecentAttemptCount(String ipAddress, LocalDateTime now) {
        LocalDateTime fiveMinutesAgo = now.minusMinutes(5);
        return repository.countByIpAddressAndTimestampAfter(ipAddress, fiveMinutesAgo);
    }

    @Override
    public LoginAttemptDTO enrichAttemptWithStats(LoginAttemptDTO dto) {
        String ip = dto.getIpAddress();

        // 🕒 Get the last 10 login attempts from this IP
        List<LoginAttempt> recentAttempts = repository
                .findTop10ByIpAddressOrderByTimestampDesc(ip);

        int count = recentAttempts.size();
        dto.setAttemptCount(count);

        if (count > 1) {
            // 📏 Calculate the time difference between first and last attempt
            LocalDateTime first = recentAttempts.get(count - 1).getTimestamp();
            LocalDateTime last = recentAttempts.get(0).getTimestamp();
            long minutes = java.time.Duration.between(first, last).toMinutes();

            dto.setTimeframe(minutes + " min");
        } else {
            dto.setTimeframe("1 min");
        }

        return dto;
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


