package com.example.library.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = IsbnValidator.class)
@Target({ElementType.METHOD, ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidIsbn {
    String message() default "ISBN must be exactly 10 or 13 digits (hyphens/spaces are ignored)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
