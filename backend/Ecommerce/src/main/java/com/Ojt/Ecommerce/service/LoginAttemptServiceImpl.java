package com.Ojt.Ecommerce.service;


import com.Ojt.Ecommerce.dto.LoginAttemptDTO;
import com.Ojt.Ecommerce.dto.PagedResponse;
import com.Ojt.Ecommerce.entity.LoginAttempt;
import com.Ojt.Ecommerce.entity.BlockedIP;
import com.Ojt.Ecommerce.repository.LoginAttemptRepository;
import com.Ojt.Ecommerce.repository.BlockedIPRepository;
import com.Ojt.Ecommerce.service.LoginAttemptService;
import com.Ojt.Ecommerce.service.EmailService;
import com.Ojt.Ecommerce.service.SecurityPolicyService;
import com.Ojt.Ecommerce.entity.SecurityPolicyRule;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.HashMap;
import java.util.Map;

@Service
public class LoginAttemptServiceImpl implements LoginAttemptService {

    @Autowired
    private LoginAttemptRepository repository;

    @Autowired
    private BlockedIPRepository blockedIPRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SecurityPolicyService securityPolicyService;

    @Autowired
    private ModelMapper modelMapper;

    private static final int BLOCK_MINUTES = 15;

    private final ObjectMapper objectMapper = new ObjectMapper();

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

        // If there are 5 or more attempts in the last 5 minutes, increase score
        if (dto.getAttemptCount() != null && dto.getAttemptCount() >= 5) {
            score += 15;
        }

        // NEW LOGIC: If this is a successful login, but there were multiple recent failed attempts from this IP, increase threat score
        if ("successful".equalsIgnoreCase(dto.getStatus())) {
            // Count failed attempts from this IP in the last 15 minutes
            int recentFailed = (int) repository.findAll().stream()
                .filter(a -> a.getIpAddress().equals(dto.getIpAddress()))
                .filter(a -> a.getStatus().equalsIgnoreCase("failed"))
                .filter(a -> a.getTimestamp().isAfter(LocalDateTime.now().minusMinutes(15)))
                .count();
            if (recentFailed >= 3) {
                // If 3 or more failed attempts in last 15 min, treat as high risk
                score += 40; // This will push the score to high/critical
            } else if (recentFailed == 2) {
                score += 20; // Medium risk
            } else if (recentFailed == 1) {
                score += 10; // Slightly elevated
            }
        }

        return Math.min(score, 100); // Max cap at 100
    }

    public String determineThreatLevel(int score) {
        if (score >= 80) return "critical";
        if (score >= 60) return "high";
        if (score >= 30) return "medium";
        return "low";
    }

    @Override
    public void blockIPForDuration(String ip, int minutes) {
        // Block in BlockedIP table for custom duration
        LocalDateTime blockedUntil = LocalDateTime.now().plusMinutes(minutes);
        Optional<BlockedIP> existing = blockedIPRepository.findByIpAddress(ip);
        if (existing.isPresent()) {
            BlockedIP block = existing.get();
            block.setBlockedUntil(blockedUntil);
            blockedIPRepository.save(block);
        } else {
            BlockedIP block = BlockedIP.builder()
                    .ipAddress(ip)
                    .blockedUntil(blockedUntil)
                    .reason("Auto-ban after repeated failed logins")
                    .build();
            blockedIPRepository.save(block);
        }
    }

    @Override
    public void resetFailedAttempts(String ip) {
        // Remove all failed attempts for this IP in the last 15 min (optional: could be a flag or cleanup)
        // For now, do nothing as attempts are time-based; could implement cleanup if needed
    }

    // Helper: Track OTP/CAPTCHA requirement per IP (in-memory for demo; use Redis/DB for prod)
    private final Map<String, LocalDateTime> otpCaptchaRequired = new HashMap<>();

    // Helper: Get failed attempts for IP in last X minutes
    private int getRecentFailedAttempts(String ip, int minutes) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(minutes);
        return (int) repository.findAll().stream()
            .filter(a -> a.getIpAddress().equals(ip))
            .filter(a -> a.getStatus().equalsIgnoreCase("failed"))
            .filter(a -> a.getTimestamp().isAfter(since))
            .count();
    }

    // Helper: Get last successful login IP for user
    private String getLastSuccessIp(String username) {
        return repository.findAll().stream()
            .filter(a -> a.getUsername().equals(username))
            .filter(a -> a.getStatus().equalsIgnoreCase("successful"))
            .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
            .map(LoginAttempt::getIpAddress)
            .findFirst().orElse(null);
    }

    // Call this on each failed login attempt
    public void handleFailedLogin(String username, String ip, String location) {
        List<SecurityPolicyRule> rules = securityPolicyService.getAllRules();
        for (SecurityPolicyRule rule : rules) {
            int fails = getRecentFailedAttempts(ip, rule.getWindowMinutes());
            switch (rule.getAction()) {
                case "email_alert":
                    if (fails == rule.getAttempts()) {
                        String lastSuccessIp = getLastSuccessIp(username);
                        if (lastSuccessIp == null || !lastSuccessIp.equals(ip)) {
                            emailService.sendEmail(username, "Suspicious Login Attempt", "A suspicious login attempt was detected from " + location + ". If this wasn't you, please secure your account.");
                        }
                    }
                    break;
                case "require_otp":
                    if (fails == rule.getAttempts()) {
                        otpCaptchaRequired.put(ip, LocalDateTime.now().plusMinutes(rule.getWindowMinutes()));
                        emailService.sendEmail(username, "Security Alert: Extra Verification Required", "Multiple failed login attempts detected. OTP and CAPTCHA will be required for your next login from this device.");
                        // TODO: Notify admin (implement as needed)
                    }
                    break;
                case "ban_ip":
                    if (fails >= rule.getAttempts()) {
                        int banMinutes = 24 * 60; // default 24h
                        try {
                            if (rule.getExtraData() != null) {
                                banMinutes = objectMapper.readTree(rule.getExtraData()).path("banMinutes").asInt(banMinutes);
                            }
                        } catch (Exception ignored) {}
                        blockIPCustom(ip, username, banMinutes, "Too many failed login attempts");
                        emailService.sendEmail(username, "IP Banned", "Your IP (" + ip + ") has been banned for " + (banMinutes/60) + " hours due to repeated failed login attempts.");
                    }
                    break;
                // Add more dynamic actions as needed
            }
        }
    }

    // Helper: Ban IP for custom minutes
    public void blockIPCustom(String ip, String username, int minutes, String reason) {
        LocalDateTime blockedUntil = LocalDateTime.now().plusMinutes(minutes);
        Optional<BlockedIP> existing = blockedIPRepository.findByIpAddress(ip);
        if (existing.isPresent()) {
            BlockedIP block = existing.get();
            block.setBlockedUntil(blockedUntil);
            block.setReason(reason);
            blockedIPRepository.save(block);
        } else {
            BlockedIP block = BlockedIP.builder()
                    .ipAddress(ip)
                    .blockedUntil(blockedUntil)
                    .userEmail(username)
                    .reason(reason)
                    .build();
            blockedIPRepository.save(block);
        }
    }

    // Call this on successful login
    public void handleSuccessfulLogin(String ip) {
        // Reset OTP/CAPTCHA requirement for this IP
        otpCaptchaRequired.remove(ip);
    }

    // Check if OTP/CAPTCHA is required for this IP
    public boolean isOtpCaptchaRequired(String ip) {
        LocalDateTime until = otpCaptchaRequired.get(ip);
        return until != null && until.isAfter(LocalDateTime.now());
    }

}


