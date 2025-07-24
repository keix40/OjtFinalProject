package com.Ojt.Ecommerce.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private NewsLetterService newsLetterService;

    public void sendEmail(String toEmail, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom("Pyaehtookyaw65@gmail.com");

        mailSender.send(message);
    }

    public void sendHtmlEmailWithImage(String toEmail, String subject, String htmlBody, String imagePath, String imageCid) throws MessagingException {
        // Only send if the email is a newsletter subscriber
        List<String> subscribers = newsLetterService.getAllSubscriberEmails()
                .stream()
                .map(String::toLowerCase)
                .toList();
        if (!subscribers.contains(toEmail.toLowerCase())) {
            System.out.println("Email not subscribed: " + toEmail);
            return;
        }
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setFrom("Pyaehtookyaw65@gmail.com");
        helper.setText(htmlBody, true);
        if (imagePath != null) {
            java.io.File imageFile = new java.io.File(imagePath);
            if (imageFile.exists()) {
                helper.addInline(imageCid, imageFile);
            }
        }
        System.out.println("New email sent to all subscribe email");
        mailSender.send(message);
    }

    public void sendSystemUpdateToSubscribers(String subject, String htmlBody, String imagePath, String imageCid) {
        for (String email : newsLetterService.getAllSubscriberEmails()) {
            try {
                sendHtmlEmailWithImage(email, subject, htmlBody, imagePath, imageCid);
            } catch (Exception e) {
                // Optionally log the error, but continue with others
                System.err.println("Failed to send to: " + email + ", reason: " + e.getMessage());
            }
        }
    }
}

