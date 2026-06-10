package com.example.library.controller;

import com.example.library.dto.response.BorrowResponse;
import com.example.library.service.BorrowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final BorrowService borrowService;

    @PostMapping("/approve/{id}")
    public ResponseEntity<BorrowResponse> approveRequest(@PathVariable Long id) {
        BorrowResponse response = borrowService.approveBorrowRequest(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reject/{id}")
    public ResponseEntity<BorrowResponse> rejectRequest(@PathVariable Long id) {
        BorrowResponse response = borrowService.rejectBorrowRequest(id);
        return ResponseEntity.ok(response);
    }
}
