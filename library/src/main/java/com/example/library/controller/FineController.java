package com.example.library.controller;

import com.example.library.dto.request.UpdateFineStatusRequest;
import com.example.library.dto.response.FineResponse;
import com.example.library.enums.FineStatus;
import com.example.library.service.FineService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fines")
@RequiredArgsConstructor
public class FineController {

    private final FineService fineService;

    @GetMapping
    public ResponseEntity<Page<FineResponse>> getAllFines(
            @RequestParam(required = false) FineStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort) {
            
        Pageable pageable;
        if (sort.length == 2) {
            Sort.Direction direction = sort[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            pageable = PageRequest.of(page, size, Sort.by(direction, sort[0]));
        } else {
            pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        return ResponseEntity.ok(fineService.getAllFines(status, search, pageable));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<FineResponse>> getFinesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(fineService.getFinesByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FineResponse> getFineById(@PathVariable Long id) {
        return ResponseEntity.ok(fineService.getFineById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<FineResponse> updateFineStatus(
            @PathVariable Long id,
            @RequestBody UpdateFineStatusRequest request,
            @RequestParam(defaultValue = "Admin") String adminName) {
        return ResponseEntity.ok(fineService.updateFineStatus(id, request, adminName));
    }
    
    @GetMapping("/outstanding/{userId}")
    public ResponseEntity<Boolean> hasOutstandingFines(@PathVariable Long userId) {
        return ResponseEntity.ok(fineService.hasOutstandingFines(userId));
    }
}
