package com.example.library.controller;

import lombok.RequiredArgsConstructor;

import com.example.library.dto.request.BorrowRequestDto;
import com.example.library.dto.response.BorrowResponse;
import com.example.library.service.BorrowService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/borrow")
@RequiredArgsConstructor
public class BorrowController {

    private final BorrowService borrowService;

    @PostMapping("/request")
    public ResponseEntity<BorrowResponse> submitBorrowRequest(@Valid @RequestBody BorrowRequestDto requestDto) {
        BorrowResponse response = borrowService.submitBorrowRequest(requestDto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/return")
    public ResponseEntity<BorrowResponse> returnBook(
            @RequestParam Long userId,
            @RequestParam String accessionNumber) {
        BorrowResponse response = borrowService.returnBook(userId, accessionNumber);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<BorrowResponse>> getAllRequests() {
        List<BorrowResponse> response = borrowService.getAllRequests();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BorrowResponse>> getRequestsByUserId(@PathVariable Long userId) {
        List<BorrowResponse> response = borrowService.getRequestsByUserId(userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{requestId}/cancel")
    public ResponseEntity<BorrowResponse> cancelBorrowRequest(
            @PathVariable Long requestId,
            @RequestParam Long userId) {
        BorrowResponse response = borrowService.cancelBorrowRequest(requestId, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{requestId}/extend")
    public ResponseEntity<BorrowResponse> extendBorrow(
            @PathVariable Long requestId,
            @RequestParam Long userId) {
        BorrowResponse response = borrowService.extendBorrow(requestId, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/extend")
    public ResponseEntity<BorrowResponse> extendBookAdmin(
            @RequestParam Long userId,
            @RequestParam String accessionNumber) {
        BorrowResponse response = borrowService.extendBookAdmin(userId, accessionNumber);
        return ResponseEntity.ok(response);
    }
}
