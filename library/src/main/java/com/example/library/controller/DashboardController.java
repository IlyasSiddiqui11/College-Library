package com.example.library.controller;

import lombok.RequiredArgsConstructor;
import com.example.library.dto.response.DashboardOverviewResponse;
import com.example.library.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/today")
    public ResponseEntity<DashboardOverviewResponse> getTodaysOverview() {
        DashboardOverviewResponse response = dashboardService.getTodaysOverview();
        return ResponseEntity.ok(response);
    }
}
