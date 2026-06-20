package com.example.library.dto.response;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


import lombok.Data;


import com.example.library.enums.BorrowStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BorrowResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String isbn;
    private BorrowStatus status;
    private LocalDateTime requestDate;
    private LocalDateTime approvedDate;
    private LocalDateTime dueDate;
    private LocalDateTime returnedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String accessionNumber;
}
