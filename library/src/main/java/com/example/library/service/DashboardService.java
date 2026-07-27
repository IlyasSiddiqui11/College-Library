package com.example.library.service;

import lombok.RequiredArgsConstructor;
import com.example.library.dto.response.DashboardOverviewResponse;
import com.example.library.dto.response.GateLogResponse;
import com.example.library.dto.response.BorrowResponse;
import com.example.library.entity.GateLog;
import com.example.library.entity.BorrowRequest;
import com.example.library.entity.LostBook;
import com.example.library.enums.BorrowStatus;
import com.example.library.repository.BorrowRequestRepository;
import com.example.library.repository.GateLogRepository;
import com.example.library.repository.LostBookRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {
    
    private final GateLogRepository gateLogRepository;
    private final BorrowRequestRepository borrowRequestRepository;
    private final LostBookRepository lostBookRepository;
    
    @Transactional(readOnly = true)
    public DashboardOverviewResponse getTodaysOverview() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        
        List<GateLog> todaysGateLogs = gateLogRepository.findAllByEntryTimeBetweenOrderByEntryTimeDesc(startOfDay, endOfDay);
        
        long todaysEntries = todaysGateLogs.size();
        long todaysExits = todaysGateLogs.stream().filter(l -> l.getExitTime() != null).count();
        long studentsCurrentlyInside = gateLogRepository.countByExitTimeIsNull();
        long todaysTotalGateLogs = todaysEntries; // Or (entries + exits) based on interpretation, usually entries is total visitors
        
        long todaysBorrowRequests = borrowRequestRepository.countByRequestDateBetween(startOfDay, endOfDay);
        long todaysReturnedBooks = borrowRequestRepository.countByReturnedDateBetween(startOfDay, endOfDay);
        long totalLostBooks = lostBookRepository.count();
        
        List<GateLogResponse> todaysGateActivity = todaysGateLogs.stream()
                .limit(10)
                .map(this::mapToGateLogResponse)
                .collect(Collectors.toList());
                
        List<BorrowResponse> latestBorrowRequests = borrowRequestRepository.findTop10ByOrderByRequestDateDesc().stream()
                .map(this::mapToBorrowResponse)
                .collect(Collectors.toList());
                
        List<BorrowResponse> latestReturns = borrowRequestRepository.findTop10ByStatusOrderByReturnedDateDesc(BorrowStatus.RETURNED).stream()
                .map(this::mapToBorrowResponse)
                .collect(Collectors.toList());
                
        List<LostBook> latestLostBooks = lostBookRepository.findAllByOrderByReportedAtDesc().stream()
                .limit(10)
                .collect(Collectors.toList());
        
        return DashboardOverviewResponse.builder()
                .todaysEntries(todaysEntries)
                .todaysExits(todaysExits)
                .studentsCurrentlyInside(studentsCurrentlyInside)
                .todaysTotalGateLogs(todaysTotalGateLogs)
                .todaysBorrowRequests(todaysBorrowRequests)
                .todaysReturnedBooks(todaysReturnedBooks)
                .totalLostBooks(totalLostBooks)
                .todaysGateActivity(todaysGateActivity)
                .latestBorrowRequests(latestBorrowRequests)
                .latestReturns(latestReturns)
                .latestLostBooks(latestLostBooks)
                .build();
    }
    
    private GateLogResponse mapToGateLogResponse(GateLog log) {
        return GateLogResponse.builder()
                .id(log.getId())
                .userId(log.getUser().getId())
                .userName(log.getUser().getName())
                .userEmail(log.getUser().getEmail())
                .entryTime(log.getEntryTime())
                .exitTime(log.getExitTime())
                .createdAt(log.getCreatedAt())
                .build();
    }
    
    private BorrowResponse mapToBorrowResponse(BorrowRequest req) {
        return BorrowResponse.builder()
                .id(req.getId())
                .userId(req.getUser().getId())
                .userName(req.getUser().getName())
                .bookId(req.getBook() != null ? req.getBook().getId() : null)
                .bookTitle(req.getBook() != null ? req.getBook().getTitle() : null)
                .isbn(req.getIsbn())
                .accessionNumber(req.getAccessionNumber())
                .requestDate(req.getRequestDate())
                .approvedDate(req.getApprovedDate())
                .dueDate(req.getDueDate())
                .returnedDate(req.getReturnedDate())
                .status(req.getStatus())
                .build();
    }
}
