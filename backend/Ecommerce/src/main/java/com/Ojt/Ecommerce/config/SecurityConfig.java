package com.Ojt.Ecommerce.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.Ojt.Ecommerce.service.UserDetailsServiceImpl;
import com.Ojt.Ecommerce.config.IPBanFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor


//add permit userController(kei)
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtFilter;
    private final JwtAuthenticationEntryPoint entryPoint;
    private final UserDetailsServiceImpl userDetailsService;
    private final IPBanFilter ipBanFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))  // ✅ Enable CORS here
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(ex -> ex.authenticationEntryPoint(entryPoint))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(HttpMethod.POST, "/api/appeals/submit").permitAll() // Allow blacklisted users to submit appeals - MUST BE FIRST
                        .requestMatchers("/api/auth/**").permitAll()  // ✅ Only write this once
                        .requestMatchers("/product/**").permitAll()
                        .requestMatchers("/ws-review/**", "/ws-review/info/**").permitAll()
                        .requestMatchers("product/**").permitAll()
                        .requestMatchers("/product_image/**").permitAll()
                        .requestMatchers("/review/**").permitAll()
                        .requestMatchers("/returns/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/category/**").permitAll()
                        .requestMatchers("/brand/**").permitAll()
                        .requestMatchers("/attribute/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll() // for profile image by pmk june 11
                        .requestMatchers("/upload/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/wishlist/**").permitAll()
                        .requestMatchers("/order/**").permitAll()
                        .requestMatchers("/review/**").permitAll()
                        .requestMatchers("/card/**").permitAll()
                        .requestMatchers("/return_images/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/user/**").permitAll()
                        .requestMatchers("/api/discounts/**").permitAll()
                        .requestMatchers("/api/admin/discounts/**").permitAll()
                        .requestMatchers("/api/policies/**").permitAll()
                        .requestMatchers("/api/coupons/validate").permitAll()
                        .requestMatchers("/api/login-attempts/is-blocked").permitAll()
                        .requestMatchers("/brand_and_category_image/**").permitAll()
                        .requestMatchers("/review/**").permitAll()
                        .requestMatchers("/deliveryservice/**").permitAll()
                        .requestMatchers("/api/contact/**").permitAll()
                        .requestMatchers("/api/notification/**").permitAll()
                        .requestMatchers("/api/newsletter/**").permitAll()
                        .requestMatchers("/events/**").permitAll()
                        .requestMatchers("/event/**").permitAll()
                        .requestMatchers("/api/product-reports/**").permitAll()


                        .anyRequest().authenticated()

                );

        http.addFilterBefore(ipBanFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }



    // ✅ fix 500 error (kei _4)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Use specific origins instead of wildcard
        configuration.setAllowedOriginPatterns(List.of("http://localhost:4200", "http://localhost:3000"));
        
        // Set allowed methods
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        
        // Set allowed headers - include all necessary headers
        configuration.setAllowedHeaders(List.of(
            "Authorization", 
            "Content-Type", 
            "X-Requested-With", 
            "Accept", 
            "Origin", 
            "Access-Control-Request-Method", 
            "Access-Control-Request-Headers",
            "x-forwarded-for",
            "x-forwarded-proto",
            "x-forwarded-host",
            "x-client-ip",
            "X-Client-IP",
            "X-Forwarded-For",
            "X-Forwarded-Proto",
            "X-Forwarded-Host",
            "Sec-WebSocket-Protocol",
            "Sec-WebSocket-Key",
            "Sec-WebSocket-Version",
            "Sec-WebSocket-Extensions"
        ));
        
        // Allow credentials
        configuration.setAllowCredentials(true);
        
        // Set exposed headers
        configuration.setExposedHeaders(List.of("Authorization", "Content-Type"));
        
        // Cache preflight requests for 1 hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        source.registerCorsConfiguration("/ws/**", configuration);
        source.registerCorsConfiguration("/ws-review/**", configuration);
        return source;
    }

//    @Bean
//    CorsConfigurationSource corsConfigurationSource() {
//        CorsConfiguration configuration = new CorsConfiguration();
//        configuration.setAllowedOrigins(List.of("http://localhost:4200")); // allow your Angular app origin
//        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
//        configuration.setAllowedHeaders(List.of("*"));  // allow all headers
//        configuration.setAllowCredentials(true);  // allow credentials (cookies, auth headers)
//
//        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//        source.registerCorsConfiguration("/**", configuration);  // apply for all endpoints
//        return source;
//    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
