package com.example.library.dto.request;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


import lombok.Data;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BorrowRequestDto {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "ISBN is required")
    @com.example.library.validation.ValidIsbn
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using = com.example.library.validation.IsbnDeserializer.class)
    private String isbn;
}
