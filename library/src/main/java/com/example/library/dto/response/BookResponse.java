package com.example.library.dto.response;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


import lombok.Data;



import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookResponse {
    private Long id;
    private String isbn;
    private String title;
    private String author;
    private int totalCopies;
    private int availableCopies;
    private String publisher;
    private Double price;
    private Integer publicationYear;
    private String accessionNumbers;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
