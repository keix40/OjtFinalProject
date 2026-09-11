package com.Ojt.Ecommerce.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix = "app.cors")
@Getter
@Setter
public class CorsProperties {

    /**
     * Comma-separated origin patterns (supports wildcards). Bound from CORS_ALLOWED_ORIGINS.
     */
    private String allowedOrigins =
            "http://localhost:4200,http://127.0.0.1:4200,http://localhost:3000,http://127.0.0.1:3000";

    public List<String> getAllowedOriginPatternsList() {
        return Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
    }
}
