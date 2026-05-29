package com.example.library.controller;

import com.example.library.dto.request.GateScanRequest;
import com.example.library.dto.response.GateLogResponse;
import com.example.library.dto.response.GateStatusResponse;
import com.example.library.service.GateLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gate")
@RequiredArgsConstructor
public class GateController {

    private final GateLogService gateLogService;

    @PostMapping("/scan")
    public ResponseEntity<GateLogResponse> scanGate(@Valid @RequestBody GateScanRequest request) {
        GateLogResponse response = gateLogService.scanGate(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/exit/{userId}")
    public ResponseEntity<GateLogResponse> exitLibrary(@PathVariable Long userId) {
        GateLogResponse response = gateLogService.exitLibrary(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{userId}")
    public ResponseEntity<GateStatusResponse> getStatus(@PathVariable Long userId) {
        GateStatusResponse response = gateLogService.getStatus(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/logs")
    public ResponseEntity<List<GateLogResponse>> getAllLogs() {
        List<GateLogResponse> response = gateLogService.getAllLogs();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<GateLogResponse>> getLogsByUserId(@PathVariable Long userId) {
        List<GateLogResponse> response = gateLogService.getLogsByUserId(userId);
        return ResponseEntity.ok(response);
    }
}
