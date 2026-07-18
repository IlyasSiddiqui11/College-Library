package com.example.library.dto.request;

import lombok.Data;

@Data
public class ReservationRequestDto {
    private Long userId;
    private String isbn;
}
