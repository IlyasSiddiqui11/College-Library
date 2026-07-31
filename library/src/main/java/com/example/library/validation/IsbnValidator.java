package com.example.library.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class IsbnValidator implements ConstraintValidator<ValidIsbn, String> {
    
    @Override
    public boolean isValid(String isbnField, ConstraintValidatorContext context) {
        if (isbnField == null || isbnField.trim().isEmpty()) {
            return false;
        }
        
        // Remove spaces and hyphens
        String sanitized = isbnField.replaceAll("[\\s-]", "");
        
        // Check if remaining characters are digits only
        if (!sanitized.matches("\\d+")) {
            return false;
        }
        
        // Check length
        return sanitized.length() == 10 || sanitized.length() == 13;
    }
}
