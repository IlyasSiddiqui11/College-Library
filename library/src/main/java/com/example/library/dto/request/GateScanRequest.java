package com.example.library.dto.request;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


import lombok.Data;


import jakarta.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GateScanRequest {

    @NotNull(message = "User ID is required")
    private Long userId;
}
