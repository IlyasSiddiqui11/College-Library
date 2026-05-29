package com.example.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BorrowRequestDto {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "ISBN is required")
    private String isbn;
}
