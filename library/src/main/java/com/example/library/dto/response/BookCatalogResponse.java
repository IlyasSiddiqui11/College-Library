package com.example.library.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookCatalogResponse {
    private String isbn;
    private String title;
    private String author;
    private String publisher;
    private String edition;
    private String series;
    private Integer publicationYear;
    private String branch;
    private String category;
    private String language;
    /** "Available" if at least one copy is AVAILABLE, otherwise "Unavailable" */
    private String availability;
    private long availableCopies;
    private long totalCopies;
}
