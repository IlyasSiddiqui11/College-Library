package com.example.library.controller;

import lombok.RequiredArgsConstructor;


import com.example.library.dto.request.BookCreateRequest;
import com.example.library.dto.response.BookResponse;
import com.example.library.dto.response.BulkUploadResponse;
import org.springframework.web.multipart.MultipartFile;
import com.example.library.service.BookService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @PostMapping
    public ResponseEntity<BookResponse> addBook(@Valid @RequestBody BookCreateRequest request) {
        BookResponse response = bookService.addBook(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/bulk-upload")
    public ResponseEntity<BulkUploadResponse> bulkUploadBooks(@RequestParam("file") MultipartFile file) {
        BulkUploadResponse response = bookService.bulkUploadBooks(file);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<BookResponse>> getAllBooks() {
        List<BookResponse> response = bookService.getAllBooks();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/isbn/{isbn}")
    public ResponseEntity<BookResponse> getBookByIsbn(@PathVariable String isbn) {
        BookResponse response = bookService.getBookByIsbn(isbn);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/inventory")
    public ResponseEntity<BookResponse> updateInventory(@PathVariable Long id, @RequestParam int totalCopies) {
        BookResponse response = bookService.updateInventory(id, totalCopies);
        return ResponseEntity.ok(response);
    }
}
