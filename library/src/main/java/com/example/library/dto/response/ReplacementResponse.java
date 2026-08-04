package com.example.library.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReplacementResponse {
    private Long id;

    // Original Book Details
    private Long originalBookId;
    private String originalAccessionNumber;
    private String originalIsbn;
    private String originalTitle;
    private String originalAuthor;
    private String originalPublisher;
    private String originalEdition;
    private String originalCategory;
    private String originalStatus;

    // Replacement Book Details
    private Long replacementBookId;
    private String replacementAccessionNumber;
    private String replacementIsbn;
    private String replacementTitle;
    private String replacementAuthor;
    private String replacementPublisher;
    private String replacementEdition;
    private String replacementCategory;
    private String replacementStatus;

    // Replacement Information
    private Long studentId;
    private String studentName;
    private String replacedByAdmin;
    private LocalDateTime replacementDate;
    private String remarks;
}
