package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.exception.EmailDeliveryException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private NewsLetterService newsLetterService;

    @Value("${app.mail.resend-api-key:}")
    private String resendApiKey;

    @Value("${app.mail.from:${MAIL_FROM:noreply@onboarding.resend.dev}}")
    private String mailFrom;

    public void sendEmail(String toEmail, String subject, String body) {
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            sendViaResend(toEmail, subject, body, false);
            return;
        }
        sendViaSmtp(toEmail, subject, body);
    }

    private void sendViaResend(String toEmail, String subject, String body, boolean html) {
        sendViaResend(List.of(toEmail), subject, body, html);
    }

    private void sendViaResend(List<String> toEmails, String subject, String body, boolean html) {
        try {
            JSONArray recipients = new JSONArray();
            for (String email : toEmails) {
                if (email != null && !email.isBlank()) {
                    recipients.put(email.trim());
                }
            }
            if (recipients.isEmpty()) {
                throw new EmailDeliveryException("No valid recipient email address.");
            }

            JSONObject payload = new JSONObject();
            payload.put("from", mailFrom);
            payload.put("to", recipients);
            payload.put("subject", subject);
            if (html) {
                payload.put("html", body);
            } else {
                payload.put("text", body);
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                    .build();

            HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Resend API error: status={} body={}", response.statusCode(), response.body());
                throw new EmailDeliveryException(resendClientMessage(response.statusCode(), response.body()));
            }
        } catch (EmailDeliveryException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Resend API request failed: {}", ex.getMessage());
            throw new EmailDeliveryException(
                    "Email service temporarily unavailable. Please try again later.", ex);
        }
    }

    private static String resendClientMessage(int statusCode, String responseBody) {
        if (statusCode == 403 || statusCode == 422) {
            String detail = extractResendErrorMessage(responseBody);
            if (detail != null && (detail.toLowerCase().contains("domain")
                    || detail.toLowerCase().contains("from")
                    || detail.toLowerCase().contains("recipient")
                    || detail.toLowerCase().contains("verified"))) {
                return "Email could not be sent. Check that the sender domain and recipient are allowed for your mail provider.";
            }
            return "Email could not be sent due to a configuration issue. Please contact support.";
        }
        return "Email service temporarily unavailable. Please try again later.";
    }

    private static String extractResendErrorMessage(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return null;
        }
        try {
            JSONObject json = new JSONObject(responseBody);
            if (json.has("message")) {
                return json.getString("message");
            }
        } catch (Exception ignored) {
            // fall through
        }
        return responseBody.length() > 200 ? responseBody.substring(0, 200) : responseBody;
    }

    private void sendViaSmtp(String toEmail, String subject, String body) {
        if (mailSender == null) {
            throw new EmailDeliveryException(
                    "Email is not configured. Set RESEND_API_KEY on Render (recommended) or SMTP credentials.");
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom(mailFrom);
            mailSender.send(message);
        } catch (Exception ex) {
            throw new EmailDeliveryException(
                    "Email service temporarily unavailable. Please try again later.", ex);
        }
    }

    public void sendHtmlEmailWithImage(String toEmail, String subject, String htmlBody, String imagePath, String imageCid) throws MessagingException {
        List<String> subscribers = newsLetterService.getAllSubscriberEmails()
                .stream()
                .map(String::toLowerCase)
                .toList();
        if (!subscribers.contains(toEmail.toLowerCase())) {
            return;
        }

        if (resendApiKey != null && !resendApiKey.isBlank()) {
            sendViaResend(toEmail, subject, htmlBody, true);
            return;
        }

        if (mailSender == null) {
            throw new EmailDeliveryException(
                    "Email is not configured. Set RESEND_API_KEY on Render (recommended) or SMTP credentials.");
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setFrom(mailFrom);
        helper.setText(htmlBody, true);
        if (imagePath != null) {
            java.io.File imageFile = new java.io.File(imagePath);
            if (imageFile.exists()) {
                helper.addInline(imageCid, imageFile);
            }
        }
        try {
            mailSender.send(message);
        } catch (Exception ex) {
            throw new EmailDeliveryException(
                    "Email service temporarily unavailable. Please try again later.", ex);
        }
    }

    public void sendSystemUpdateToSubscribers(String subject, String htmlBody, String imagePath, String imageCid) {
        for (String email : newsLetterService.getAllSubscriberEmails()) {
            try {
                sendHtmlEmailWithImage(email, subject, htmlBody, imagePath, imageCid);
            } catch (Exception e) {
                System.err.println("Failed to send to: " + email + ", reason: " + e.getMessage());
            }
        }
    }
}
