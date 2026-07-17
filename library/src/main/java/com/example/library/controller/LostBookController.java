package com.example.library.controller;

import lombok.RequiredArgsConstructor;
import com.example.library.dto.request.LostBookReportRequest;
import com.example.library.dto.response.LostBookDetailsResponse;
import com.example.library.entity.LostBook;
import com.example.library.service.LostBookService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lost-books")
@RequiredArgsConstructor
public class LostBookController {

    private final LostBookService lostBookService;

    @GetMapping("/find/{accessionNumber}")
    public ResponseEntity<LostBookDetailsResponse> getLostBookDetails(@PathVariable String accessionNumber) {
        LostBookDetailsResponse response = lostBookService.getLostBookDetails(accessionNumber);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<LostBook> reportLostBook(@Valid @RequestBody LostBookReportRequest request) {
        LostBook response = lostBookService.reportLostBook(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<LostBook>> getAllLostBooks() {
        List<LostBook> response = lostBookService.getAllLostBooks();
        return ResponseEntity.ok(response);
    }
}
