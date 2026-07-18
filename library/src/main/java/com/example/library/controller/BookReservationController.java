package com.example.library.controller;

import com.example.library.dto.request.ReservationRequestDto;
import com.example.library.dto.response.ReservationResponse;
import com.example.library.service.BookReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BookReservationController {

    private final BookReservationService bookReservationService;

    @PostMapping
    public ResponseEntity<ReservationResponse> createReservation(@RequestBody ReservationRequestDto dto) {
        return ResponseEntity.ok(bookReservationService.createReservation(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ReservationResponse> cancelReservation(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(bookReservationService.cancelReservation(id, userId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReservationResponse>> getUserReservations(@PathVariable Long userId) {
        return ResponseEntity.ok(bookReservationService.getUserReservations(userId));
    }

    @GetMapping
    public ResponseEntity<List<ReservationResponse>> getAllReservations() {
        return ResponseEntity.ok(bookReservationService.getAllReservations());
    }
}
