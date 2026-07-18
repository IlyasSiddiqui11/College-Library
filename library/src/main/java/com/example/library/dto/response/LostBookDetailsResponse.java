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
public class LostBookDetailsResponse {
    // Book details
    private Long bookId;
    private String accessionNumber;
    private String isbn;
    private String title;
    private String author;
    private String publisher;
    private String edition;
    private String series;
    private Integer publicationYear;
    private String bookBranch;
    private String bookCategory;
    private Double price;

    // Student details
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String studentBranch;
    private String studentYear;

    // Borrow details
    private Long borrowRequestId;
    private LocalDateTime borrowDate;
    private LocalDateTime dueDate;
}
