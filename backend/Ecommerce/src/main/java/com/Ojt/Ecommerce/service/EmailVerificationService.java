package com.Ojt.Ecommerce.service;

import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class EmailVerificationService {
    //Abstract Email API
    private final String apiKey = "9875d7f07e1d42bd88418a727101ea95"; // Replace with your actual key

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isEmailReal(String email) {
        String url = UriComponentsBuilder
                .fromHttpUrl("https://emailvalidation.abstractapi.com/v1/")
                .queryParam("api_key", apiKey)
                .queryParam("email", email)
                .toUriString();

        try {
            String response = restTemplate.getForObject(url, String.class);
            JSONObject json = new JSONObject(response);

            boolean formatValid = json.getJSONObject("is_valid_format").getBoolean("value");
            boolean smtpValid = json.getJSONObject("is_smtp_valid").getBoolean("value");
            boolean mxFound = json.getJSONObject("is_mx_found").getBoolean("value");

            return formatValid && smtpValid && mxFound;
        } catch (RestClientException | NullPointerException e) {
            e.printStackTrace();
            // In case of error assume invalid email (or you can decide differently)
            return false;
        }
    }
}