package com.example.library.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookResponse {
    private Long id;
    private String isbn;
    private String title;
    private String author;
    private int totalCopies;
    private int availableCopies;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
