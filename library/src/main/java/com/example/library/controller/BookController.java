package com.example.library.controller;

import lombok.RequiredArgsConstructor;
import com.example.library.dto.request.BookCreateRequest;
import com.example.library.dto.response.AvailableCopyResponse;
import com.example.library.dto.response.BookCatalogResponse;
import com.example.library.dto.response.BookResponse;
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

    @GetMapping
    public ResponseEntity<List<BookResponse>> getAllBooks() {
        List<BookResponse> response = bookService.getAllBooks();
        return ResponseEntity.ok(response);
    }

    /** Student catalog: one row per unique ISBN with calculated availability. */
    @GetMapping("/catalog")
    public ResponseEntity<List<BookCatalogResponse>> getCatalog() {
        return ResponseEntity.ok(bookService.getCatalogGroupedByIsbn());
    }

    @GetMapping("/isbn/{isbn}")
    public ResponseEntity<BookResponse> getBookByIsbn(@PathVariable String isbn) {
        BookResponse response = bookService.getBookByIsbn(isbn);
        return ResponseEntity.ok(response);
    }

    /** Public title-level details for students (no accession / internal IDs). */
    @GetMapping("/isbn/{isbn}/details")
    public ResponseEntity<BookCatalogResponse> getBookDetailsByIsbn(@PathVariable String isbn) {
        return ResponseEntity.ok(bookService.getCatalogBookByIsbn(isbn));
    }

    /** Available physical copies for librarian assignment during borrow approval. */
    @GetMapping("/isbn/{isbn}/available-copies")
    public ResponseEntity<List<AvailableCopyResponse>> getAvailableCopies(@PathVariable String isbn) {
        return ResponseEntity.ok(bookService.getAvailableCopiesByIsbn(isbn));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookResponse> updateBook(@PathVariable Long id,
            @Valid @RequestBody BookCreateRequest request) {
        BookResponse response = bookService.updateBook(id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/inventory")
    public ResponseEntity<BookResponse> updateInventory(@PathVariable Long id, @RequestParam int totalCopies) {
        BookResponse response = bookService.updateInventory(id, totalCopies);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok().build();
    }
}
