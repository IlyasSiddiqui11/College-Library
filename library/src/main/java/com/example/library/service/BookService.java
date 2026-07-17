package com.example.library.service;

import lombok.RequiredArgsConstructor;


import com.example.library.dto.request.BookCreateRequest;
import com.example.library.dto.response.BookResponse;
import com.example.library.entity.Book;
import com.example.library.entity.BorrowRequest;
import com.example.library.enums.BorrowStatus;
import com.example.library.exception.BadRequestException;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.BookRepository;
import com.example.library.repository.BorrowRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import com.example.library.dto.response.BulkUploadResponse;
import org.springframework.web.multipart.MultipartFile;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final BorrowRequestRepository borrowRequestRepository;
    private final BorrowingService borrowingService;

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
                .publisher(request.getPublisher())
                .price(request.getPrice())
                .publicationYear(request.getPublicationYear())
                .accessionNumbers(request.getAccessionNumbers())
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

        // If copies were added (difference > 0), promote RESERVED requests to PENDING (FIFO)
        if (difference > 0) {
            List<BorrowRequest> reservations = borrowRequestRepository
                    .findByBookIsbnAndStatusOrderByRequestDateAsc(book.getIsbn(), BorrowStatus.RESERVED);

            int copiesToAllocate = Math.min(difference, reservations.size());
            for (int i = 0; i < copiesToAllocate; i++) {
                BorrowRequest reservation = reservations.get(i);
                reservation.setStatus(BorrowStatus.PENDING);
                borrowRequestRepository.save(reservation);

                // Notify the student — wrapped in try-catch so email failure doesn't roll back the DB transaction
                try {
                    String email = reservation.getUser().getEmail();
                    if (email != null && !email.isBlank()) {
                        borrowingService.processBookRequest(
                                email,
                                reservation.getUser().getName(),
                                book.getTitle(),
                                book.getAuthor(),
                                book.getIsbn(),
                                reservation.getRequestDate().toLocalDate());
                    }
                } catch (Exception emailEx) {
                    System.err.println("Failed to send reservation promotion email: " + emailEx.getMessage());
                }
            }
        }

        return mapToBookResponse(updatedBook);
    }

    @Transactional
    public BulkUploadResponse bulkUploadBooks(MultipartFile file) {
        List<Book> booksToSave = new ArrayList<>();
        List<String> errorMessages = new ArrayList<>();
        int successfulInserts = 0;
        int failedInserts = 0;
        int totalProcessed = 0;

        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(fileReader, CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {

            for (CSVRecord csvRecord : csvParser) {
                totalProcessed++;
                try {
                    String isbn = csvRecord.get("isbn");
                    if (bookRepository.existsByIsbn(isbn)) {
                        errorMessages.add("Row " + totalProcessed + ": Book with ISBN " + isbn + " already exists");
                        failedInserts++;
                        continue;
                    }

                    Book book = Book.builder()
                            .isbn(isbn)
                            .title(csvRecord.get("title"))
                            .author(csvRecord.get("author"))
                            .totalCopies(Integer.parseInt(csvRecord.get("totalCopies")))
                            .availableCopies(Integer.parseInt(csvRecord.get("totalCopies")))
                            .publisher(csvRecord.isMapped("publisher") ? csvRecord.get("publisher") : null)
                            .price(csvRecord.isMapped("price") && !csvRecord.get("price").isEmpty() ? Double.parseDouble(csvRecord.get("price")) : null)
                            .publicationYear(csvRecord.isMapped("publicationYear") && !csvRecord.get("publicationYear").isEmpty() ? Integer.parseInt(csvRecord.get("publicationYear")) : null)
                            .accessionNumbers(csvRecord.isMapped("accessionNumbers") ? csvRecord.get("accessionNumbers") : null)
                            .build();

                    booksToSave.add(book);
                    successfulInserts++;

                    if (booksToSave.size() >= 500) {
                        bookRepository.saveAll(booksToSave);
                        booksToSave.clear();
                    }
                } catch (Exception e) {
                    errorMessages.add("Row " + totalProcessed + ": " + e.getMessage());
                    failedInserts++;
                }
            }

            if (!booksToSave.isEmpty()) {
                bookRepository.saveAll(booksToSave);
            }

        } catch (Exception e) {
            throw new BadRequestException("Failed to parse CSV file: " + e.getMessage());
        }

        return BulkUploadResponse.builder()
                .totalProcessed(totalProcessed)
                .successfulInserts(successfulInserts)
                .failedInserts(failedInserts)
                .errorMessages(errorMessages)
                .build();
    }

    private BookResponse mapToBookResponse(Book book) {
        return BookResponse.builder()
                .id(book.getId())
                .isbn(book.getIsbn())
                .title(book.getTitle())
                .author(book.getAuthor())
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .publisher(book.getPublisher())
                .price(book.getPrice())
                .publicationYear(book.getPublicationYear())
                .accessionNumbers(book.getAccessionNumbers())
                .createdAt(book.getCreatedAt())
                .updatedAt(book.getUpdatedAt())
                .build();
    }
}
