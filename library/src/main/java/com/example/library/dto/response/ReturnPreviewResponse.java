package com.example.library.dto.response;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnPreviewResponse {
    private Long borrowRequestId;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    
    private Long bookId;
    private String bookTitle;
    private String accessionNumber;
    
    private LocalDateTime dueDate;
    private LocalDateTime returnDate;
    
    private Long delayDays;
    private BigDecimal fineRate;
    private BigDecimal totalFine;
}
