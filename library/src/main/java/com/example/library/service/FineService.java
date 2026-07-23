package com.example.library.service;

import com.example.library.dto.request.UpdateFineStatusRequest;
import com.example.library.dto.response.FineResponse;
import com.example.library.entity.BorrowRequest;
import com.example.library.entity.Fine;
import com.example.library.entity.User;
import com.example.library.enums.FineStatus;
import com.example.library.exception.BadRequestException;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.FineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FineService {

    private final FineRepository fineRepository;
    private final com.example.library.repository.LostBookRepository lostBookRepository;

    @Transactional
    public Fine generateFine(BorrowRequest request, long delayDays) {
        if (delayDays <= 0) {
            return null; // No fine if not delayed
        }

        BigDecimal fineRate = new BigDecimal("5.00");
        BigDecimal delayAmount = fineRate.multiply(BigDecimal.valueOf(delayDays));
        BigDecimal lostBookAmount = BigDecimal.ZERO; // Default for normal late return
        BigDecimal totalFine = delayAmount.add(lostBookAmount);

        Fine fine = Fine.builder()
                .user(request.getUser())
                .borrowRequest(request)
                .delayDays(delayDays)
                .fineRate(fineRate)
                .delayAmount(delayAmount)
                .lostBookAmount(lostBookAmount)
                .totalFine(totalFine)
                .status(FineStatus.PENDING)
                .build();

        return fineRepository.save(fine);
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public Fine generateLostBookFine(BorrowRequest request, Double bookPrice) {
        long delayDays = 0;
        if (request.getDueDate() != null && java.time.LocalDateTime.now().isAfter(request.getDueDate())) {
            delayDays = java.time.temporal.ChronoUnit.DAYS.between(request.getDueDate(), java.time.LocalDateTime.now());
        }
        
        java.math.BigDecimal fineRate = new java.math.BigDecimal("5.00");
        java.math.BigDecimal delayAmount = fineRate.multiply(java.math.BigDecimal.valueOf(delayDays));
        java.math.BigDecimal lostBookAmount = bookPrice != null ? java.math.BigDecimal.valueOf(bookPrice) : java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalFine = delayAmount.add(lostBookAmount);
        
        if (totalFine.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return null;
        }

        Fine fine = Fine.builder()
                .user(request.getUser())
                .borrowRequest(request)
                .delayDays(delayDays)
                .fineRate(fineRate)
                .delayAmount(delayAmount)
                .lostBookAmount(lostBookAmount)
                .totalFine(totalFine)
                .status(FineStatus.PENDING)
                .build();

        return fineRepository.save(fine);
    }

    @Transactional(readOnly = true)
    public Page<FineResponse> getAllFines(FineStatus status, String search, Pageable pageable) {
        return fineRepository.searchAndFilterFines(status, search, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<FineResponse> getFinesByUserId(Long userId) {
        return fineRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public FineResponse updateFineStatus(Long fineId, UpdateFineStatusRequest request, String adminName) {
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new ResourceNotFoundException("Fine not found with ID: " + fineId));

        fine.setStatus(request.getStatus());
        fine.setRemarks(request.getRemarks());
        
        if (request.getStatus() == FineStatus.PAID) {
            fine.setVerifiedBy(adminName);
            fine.setVerificationDate(LocalDateTime.now());
        }

        Fine updatedFine = fineRepository.save(fine);
        return mapToResponse(updatedFine);
    }

    @Transactional(readOnly = true)
    public boolean hasOutstandingFines(Long userId) {
        return fineRepository.existsByUserIdAndStatusIn(userId, Arrays.asList(FineStatus.PENDING, FineStatus.UNPAID));
    }
    
    @Transactional(readOnly = true)
    public FineResponse getFineById(Long fineId) {
        return fineRepository.findById(fineId)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Fine not found with ID: " + fineId));
    }

    private FineResponse mapToResponse(Fine fine) {
        User user = fine.getUser();
        BorrowRequest request = fine.getBorrowRequest();
        
        String bookTitle = "Unknown Book";
        String bookIsbn = "Unknown ISBN";
        String accessionNumber = null;
        
        if (request != null) {
            accessionNumber = request.getAccessionNumber();
            if (request.getBook() != null) {
                bookTitle = request.getBook().getTitle();
                bookIsbn = request.getBook().getIsbn();
            } else {
                if (request.getIsbn() != null) {
                    bookIsbn = request.getIsbn();
                }
                if (accessionNumber != null) {
                    com.example.library.entity.LostBook lost = lostBookRepository.findFirstByAccessionNumberOrderByReportedAtDesc(accessionNumber).orElse(null);
                    if (lost != null) {
                        bookTitle = lost.getTitle();
                        if (bookIsbn.equals("Unknown ISBN") && lost.getIsbn() != null) {
                            bookIsbn = lost.getIsbn();
                        }
                    }
                }
            }
        }

        return FineResponse.builder()
                .id(fine.getId())
                .userId(user.getId())
                .studentName(user.getName())
                .enrollmentNumber(user.getEmail()) // Using email as enrollment number fallback
                .borrowRequestId(request != null ? request.getId() : null)
                .bookTitle(bookTitle)
                .bookIsbn(bookIsbn)
                .accessionNumber(accessionNumber)
                .delayDays(fine.getDelayDays())
                .fineRate(fine.getFineRate())
                .delayAmount(fine.getDelayAmount())
                .lostBookAmount(fine.getLostBookAmount())
                .totalFine(fine.getTotalFine())
                .status(fine.getStatus())
                .verifiedBy(fine.getVerifiedBy())
                .verificationDate(fine.getVerificationDate())
                .remarks(fine.getRemarks())
                .createdAt(fine.getCreatedAt())
                .updatedAt(fine.getUpdatedAt())
                .build();
    }
}
