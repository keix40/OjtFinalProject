package com.Ojt.Ecommerce.config;

import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

//    @Bean
//    public ModelMapper mapper() {
//        return new ModelMapper();
//    }

    //fix model mapper for error 15.6.25
    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();

        // Configure ModelMapper to skip lazy-loaded Hibernate collections
        modelMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT) // Strict field matching
                .setSkipNullEnabled(true) // Skip null fields
                .setPropertyCondition(context -> {
                    // Skip Hibernate's PersistentBag (uninitialized collections)
                    return !(context.getSource() instanceof org.hibernate.collection.spi.PersistentBag);
                });

        return modelMapper;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Allow all endpoints
                .allowedOrigins("http://localhost:4200") // Allow Angular frontend
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String productImagePath = Paths.get("product_image").toAbsolutePath().toString();
        String uploadsPath = Paths.get("uploads").toAbsolutePath().toString();
        String reviewPath = Paths.get("review").toAbsolutePath().toString();

        System.out.println("Product image path: " + productImagePath);
        System.out.println("Uploads path: " + uploadsPath);
        System.out.println("Review path: " + reviewPath);

        registry.addResourceHandler("/product_image/**")
                .addResourceLocations("file:" + productImagePath + "/");

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadsPath + "/");

        registry.addResourceHandler("/review/**")
                .addResourceLocations("file:" + reviewPath + "/");
    }


}
