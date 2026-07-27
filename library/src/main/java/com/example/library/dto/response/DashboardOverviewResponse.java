package com.example.library.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;
import com.example.library.entity.LostBook;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOverviewResponse {
    private long todaysEntries;
    private long todaysExits;
    private long studentsCurrentlyInside;
    private long todaysTotalGateLogs;
    private long todaysBorrowRequests;
    private long todaysReturnedBooks;
    private long totalLostBooks; // Count or total lost books
    
    private List<GateLogResponse> todaysGateActivity;
    private List<BorrowResponse> latestBorrowRequests;
    private List<BorrowResponse> latestReturns;
    private List<LostBook> latestLostBooks;
}
