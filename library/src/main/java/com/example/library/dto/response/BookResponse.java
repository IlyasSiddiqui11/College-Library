package com.example.library.dto.response;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookResponse {
    private Long id;
    private String accessionNumber;
    private String isbn;
    private String title;
    private String author;
    private String publisher;
    private String edition;
    private String series;
    private Integer publicationYear;
    private Integer totalPages;
    private Double price;
    private String billNumber;
    private LocalDate billDate;
    private String branch;
    private String category;
    private String language;
    private String source;
    private String classificationNumber;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
