package com.example.library.dto.response;

import com.example.library.enums.BorrowStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    private LocalDateTime returnedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
