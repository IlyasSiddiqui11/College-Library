package com.example.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    private Long userId;

    @NotBlank(message = "New password is required")
    private String newPassword;
}
