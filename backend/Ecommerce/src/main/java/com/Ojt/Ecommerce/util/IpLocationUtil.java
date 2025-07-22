package com.Ojt.Ecommerce.util;

import jakarta.servlet.http.HttpServletRequest;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

public class IpLocationUtil {
    private static final Map<String, String> ipLocationCache = new ConcurrentHashMap<>();

    public static String extractClientIp(HttpServletRequest request) {
        // For local development: if X-Real-IP or X-Forwarded-For is present, always use it
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && isPublicIp(xRealIp.trim())) {
            System.out.println("[IpLocationUtil] Using X-Real-IP: " + xRealIp);
            return xRealIp.trim();
        }
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            String ip = xfHeader.split(",")[0].trim();
            if (isPublicIp(ip)) {
                System.out.println("[IpLocationUtil] Using X-Forwarded-For: " + ip);
                return ip;
            }
        }
        String clientIp = request.getHeader("X-Client-IP");
        if (clientIp != null && !clientIp.isEmpty() && isPublicIp(clientIp.trim())) {
            System.out.println("[IpLocationUtil] Using X-Client-IP: " + clientIp);
            return clientIp.trim();
        }
        String debugIp = request.getHeader("X-Debug-IP");
        if (debugIp != null && !debugIp.isEmpty()) {
            System.out.println("[IpLocationUtil] Using X-Debug-IP: " + debugIp);
            return debugIp.trim();
        }
        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr.equals("127.0.0.1") || remoteAddr.equals("0:0:0:0:0:0:0:1") || remoteAddr.equals("::1")) {
            System.out.println("[IpLocationUtil] WARNING: Detected localhost IP. For real IP/location, set X-Forwarded-For or X-Real-IP header in your request.");
        }
        return remoteAddr;
    }

    public static boolean isPublicIp(String ip) {
        return !(ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.16.") || ip.equals("127.0.0.1") || ip.equals("::1") || ip.equals("0:0:0:0:0:0:0:1"));
    }

    public static String getUserLocation(String ipAddress) {
        if ("unknown".equals(ipAddress) || ipAddress == null || ipAddress.isEmpty()) {
            return "Unknown Location";
        }
        // Check cache first
        if (ipLocationCache.containsKey(ipAddress)) {
            return ipLocationCache.get(ipAddress);
        }
        // For localhost, still try to get real location from external service
        if ("127.0.0.1".equals(ipAddress) || "0:0:0:0:0:0:0:1".equals(ipAddress) || "localhost".equals(ipAddress) || "::1".equals(ipAddress)) {
            // Try to get real location even for localhost
        }
        String location = "Unknown Location";
        try {
            String apiUrl = "http://ip-api.com/json/" + ipAddress;
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                .uri(java.net.URI.create(apiUrl))
                .timeout(java.time.Duration.ofSeconds(2)) // Add timeout for responsiveness
                .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                String responseBody = response.body();
                if (responseBody.contains("\"status\":\"success\"")) {
                    String city = extractJsonValue(responseBody, "city");
                    String country = extractJsonValue(responseBody, "country");
                    String region = extractJsonValue(responseBody, "regionName");
                    if (city != null && country != null) {
                        if ("Myanmar".equals(country) || "MM".equals(country)) {
                            location = city + ", MM";
                        } else {
                            location = city + ", " + country;
                        }
                    } else if (region != null && country != null) {
                        if ("Myanmar".equals(country) || "MM".equals(country)) {
                            location = region + ", MM";
                        } else {
                            location = region + ", " + country;
                        }
                    } else if (country != null) {
                        if ("Myanmar".equals(country) || "MM".equals(country)) {
                            location = "Myanmar";
                        } else {
                            location = country;
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error getting location for IP " + ipAddress + ": " + e.getMessage());
        }
        // Cache the result (even if Unknown Location)
        ipLocationCache.put(ipAddress, location);
        return location;
    }

    public static String extractJsonValue(String json, String key) {
        try {
            String pattern = "\"" + key + "\":\"([^\"]+)\"";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(json);
            if (m.find()) {
                return m.group(1);
            }
        } catch (Exception e) {
            // Ignore parsing errors
        }
        return null;
    }
} 