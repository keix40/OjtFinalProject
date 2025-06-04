package com.Ojt.Ecommerce.util;

import java.security.SecureRandom;

public class ProductCodeGeneratorUtil {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String PREFIX = "P-";

    public static String generateRandomProductCode(){
        int number = 100000 + RANDOM.nextInt(900000);
        return PREFIX+number;
    }
}
