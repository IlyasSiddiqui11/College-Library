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
    private final EmailService emailService;

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

        Fine savedFine = fineRepository.save(fine);

        try {
            String bookTitle = (request.getBook() != null) ? request.getBook().getTitle() : "Unknown Book";
            String subject = "Library Fine Assigned - " + bookTitle;
            String body = String.format("Dear %s,\n\nA fine of ₹%s has been assigned to your account due to a delay of %d days in returning '%s'.\n\nPlease clear the dues at your earliest convenience.\n\nRegards,\nCollege Library",
                request.getUser().getName(),
                totalFine.toString(),
                delayDays,
                bookTitle
            );
            emailService.sendEmail(request.getUser().getEmail(), subject, body);
        } catch (Exception e) {
            System.err.println("Failed to send fine assignment email: " + e.getMessage());
        }

        return savedFine;
    }

    @Transactional
    public Fine generateLostBookFine(BorrowRequest request, Double bookPrice) {
        long delayDays = 0;
        if (request.getDueDate() != null && java.time.LocalDateTime.now().isAfter(request.getDueDate())) {
            delayDays = java.time.temporal.ChronoUnit.DAYS.between(request.getDueDate(), java.time.LocalDateTime.now());
        }
        
        java.math.BigDecimal fineRate = new java.math.BigDecimal("5.00");
        java.math.BigDecimal delayAmount = fineRate.multiply(java.math.BigDecimal.valueOf(delayDays));
        java.math.BigDecimal lostBookAmount = bookPrice != null ? java.math.BigDecimal.valueOf(bookPrice) : java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalFine = delayAmount.add(lostBookAmount);

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

        Fine savedFine = fineRepository.save(fine);

        try {
            String bookTitle = (request.getBook() != null) ? request.getBook().getTitle() : (request.getIsbn() != null ? request.getIsbn() : "Unknown Book");
            String subject = "Library Fine Assigned (Lost Book) - " + bookTitle;
            String body = String.format("Dear %s,\n\nA fine of ₹%s has been assigned to your account for the lost book '%s' (including any late fees if applicable).\n\nPlease clear the dues at your earliest convenience.\n\nRegards,\nCollege Library",
                request.getUser().getName(),
                totalFine.toString(),
                bookTitle
            );
            emailService.sendEmail(request.getUser().getEmail(), subject, body);
        } catch (Exception e) {
            System.err.println("Failed to send lost book fine email: " + e.getMessage());
        }

        return savedFine;
    }

    @Transactional(readOnly = true)
    public Page<FineResponse> getAllFines(FineStatus status, String search, Pageable pageable) {
        return fineRepository.searchAndFilterFines(status, search, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<FineResponse> getFinesByUserId(Long userId) {
        return fineRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public FineResponse updateFineStatus(Long fineId, UpdateFineStatusRequest request, String adminName) {
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new ResourceNotFoundException("Fine not found with ID: " + fineId));

        boolean wasNotPaid = fine.getStatus() != FineStatus.PAID;
        fine.setStatus(request.getStatus());
        fine.setBillNumber(request.getBillNumber());
        
        if (request.getStatus() == FineStatus.PAID) {
            fine.setVerifiedBy(adminName);
            fine.setVerificationDate(LocalDateTime.now());
        }

        Fine updatedFine = fineRepository.save(fine);

        if (request.getStatus() == FineStatus.PAID && wasNotPaid) {
            try {
                String subject = "Library Fine Payment Confirmation";
                String body = String.format("Dear %s,\n\nYour payment of ₹%s for the fine associated with your library account has been successfully verified by %s.\n\nBill Number: %s\n\nThank you for clearing your dues.\n\nRegards,\nCollege Library",
                    fine.getUser().getName(),
                    fine.getTotalFine().toString(),
                    adminName,
                    request.getBillNumber() != null ? request.getBillNumber() : "N/A"
                );
                emailService.sendEmail(fine.getUser().getEmail(), subject, body);
            } catch (Exception e) {
                System.err.println("Failed to send fine payment email: " + e.getMessage());
            }
        }

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
                .userRole(user.getRole())
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
                .billNumber(fine.getBillNumber())
                .createdAt(fine.getCreatedAt())
                .updatedAt(fine.getUpdatedAt())
                .build();
    }
}
