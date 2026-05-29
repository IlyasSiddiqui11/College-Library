package com.example.library.service;

import com.example.library.dto.request.BookCreateRequest;
import com.example.library.dto.response.BookResponse;
import com.example.library.entity.Book;
import com.example.library.exception.BadRequestException;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;

    @Transactional
    public BookResponse addBook(BookCreateRequest request) {
        if (bookRepository.existsByIsbn(request.getIsbn())) {
            throw new BadRequestException("Book with ISBN " + request.getIsbn() + " already exists");
        }

        Book book = Book.builder()
                .isbn(request.getIsbn())
                .title(request.getTitle())
                .author(request.getAuthor())
                .totalCopies(request.getTotalCopies())
                .availableCopies(request.getTotalCopies())
                .build();

        Book savedBook = bookRepository.save(book);
        return mapToBookResponse(savedBook);
    }

    @Transactional(readOnly = true)
    public List<BookResponse> getAllBooks() {
        return bookRepository.findAll().stream()
                .map(this::mapToBookResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookResponse getBookByIsbn(String isbn) {
        Book book = bookRepository.findByIsbn(isbn)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with ISBN: " + isbn));
        return mapToBookResponse(book);
    }

    @Transactional
    public BookResponse updateInventory(Long id, int newTotalCopies) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with ID: " + id));

        int difference = newTotalCopies - book.getTotalCopies();
        int newAvailableCopies = book.getAvailableCopies() + difference;

        if (newAvailableCopies < 0) {
            throw new BadRequestException("Cannot reduce total copies because it would result in negative available copies (" + newAvailableCopies + ")");
        }

        book.setTotalCopies(newTotalCopies);
        book.setAvailableCopies(newAvailableCopies);

        Book updatedBook = bookRepository.save(book);
        return mapToBookResponse(updatedBook);
    }

    private BookResponse mapToBookResponse(Book book) {
        return BookResponse.builder()
                .id(book.getId())
                .isbn(book.getIsbn())
                .title(book.getTitle())
                .author(book.getAuthor())
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .createdAt(book.getCreatedAt())
                .updatedAt(book.getUpdatedAt())
                .build();
    }
}
