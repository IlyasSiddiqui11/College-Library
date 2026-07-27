package com.example.library.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyGateStatsResponse {
    private long totalEntries;
    private long totalExits;
    private long studentsCurrentlyInside;
    private long averageDailyVisitors;
    private long totalGateLogs;
}
