package com.example.library.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GateScanRequest {

    @NotNull(message = "User ID is required")
    private Long userId;
}
