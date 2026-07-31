package com.example.library.dto.request;

import lombok.Data;

@Data
public class ReservationRequestDto {
    private Long userId;
    @com.example.library.validation.ValidIsbn
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using = com.example.library.validation.IsbnDeserializer.class)
    private String isbn;
}
