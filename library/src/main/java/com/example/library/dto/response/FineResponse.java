package com.example.library.dto.response;

import com.example.library.enums.FineStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class FineResponse {
    private Long id;
    private Long userId;
    private String studentName;
    private String enrollmentNumber;
    private Long borrowRequestId;
    private String bookTitle;
    private String bookIsbn;
    private String accessionNumber;
    private Long delayDays;
    private BigDecimal fineRate;
    private BigDecimal delayAmount;
    private BigDecimal lostBookAmount;
    private BigDecimal totalFine;
    private FineStatus status;
    private String verifiedBy;
    private LocalDateTime verificationDate;
    private String billNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
