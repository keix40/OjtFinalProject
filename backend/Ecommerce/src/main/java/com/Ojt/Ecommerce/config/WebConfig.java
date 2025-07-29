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
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", 
                               "Access-Control-Request-Method", "Access-Control-Request-Headers",
                               "x-forwarded-for", "x-forwarded-proto", "x-forwarded-host", 
                               "x-client-ip", "X-Client-IP", "X-Forwarded-For", "X-Forwarded-Proto", "X-Forwarded-Host")
                .exposedHeaders("Authorization", "Content-Type")
                .allowCredentials(true)
                .maxAge(3600); // Cache preflight requests for 1 hour
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String productImagePath = Paths.get("product_image").toAbsolutePath().toString();
        String uploadsPath = Paths.get("uploads").toAbsolutePath().toString();
        String reviewPath = Paths.get("review").toAbsolutePath().toString();
        String returnImagePath = Paths.get("return_images").toAbsolutePath().toString(); // ✅ Add this line
        String brandNCategoryPath = Paths.get("brand_and_category_image").toAbsolutePath().toString(); // ✅ Add this line
        String eventPath = Paths.get("event").toAbsolutePath().toString(); // ✅ Add this line


        System.out.println("Product image path: " + productImagePath);
        System.out.println("Uploads path: " + uploadsPath);
        System.out.println("Review path: " + reviewPath);
        System.out.println("Return image path: " + returnImagePath);
        System.out.println("Brand & Category path: " + brandNCategoryPath); // ✅ Optional debug print
        System.out.println("Event path: " + eventPath); // ✅ Optional debug print


        registry.addResourceHandler("/product_image/**")
                .addResourceLocations("file:" + productImagePath + "/");

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadsPath + "/");

        registry.addResourceHandler("/review/**")
                .addResourceLocations("file:" + reviewPath + "/");

        registry.addResourceHandler("/return_images/**") // ✅ Register URL path
                .addResourceLocations("file:" + returnImagePath + "/");

        registry.addResourceHandler("/brand_and_category_image/**")
                .addResourceLocations("file:" + brandNCategoryPath + "/");

        registry.addResourceHandler("/event/**")
                .addResourceLocations("file:" + eventPath + "/");

    }
}
