package com.example.library.service;

import lombok.RequiredArgsConstructor;
import com.example.library.dto.request.BookCreateRequest;
import com.example.library.dto.response.AvailableCopyResponse;
import com.example.library.dto.response.BookCatalogResponse;
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

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
        if (request.getAccessionNumbers() == null || request.getAccessionNumbers().isEmpty()) {
            throw new BadRequestException("At least one accession number is required");
        }

        if (request.getQuantity() == null || request.getQuantity() < 1) {
            throw new BadRequestException("Quantity must be at least 1");
        }

        if (request.getQuantity() != request.getAccessionNumbers().size()) {
            throw new BadRequestException("Quantity must match the number of accession numbers provided");
        }

        Set<String> normalizedAccessions = new HashSet<>();
        for (String accession : request.getAccessionNumbers()) {
            if (accession == null || accession.trim().isEmpty()) {
                throw new BadRequestException("Accession number cannot be empty");
            }

            String normalized = accession.trim();
            if (!normalizedAccessions.add(normalized)) {
                throw new BadRequestException("Duplicate accession number in request: '" + normalized + "'");
            }

            if (bookRepository.existsByAccessionNumber(normalized)) {
                throw new BadRequestException("Book with accession number '" + normalized + "' already exists");
            }
        }

        List<Book> savedBooks = new ArrayList<>();
        for (String accession : request.getAccessionNumbers()) {
            Book book = Book.builder()
                    .accessionNumber(accession.trim())
                    .isbn(request.getIsbn())
                    .title(request.getTitle())
                    .author(request.getAuthor())
                    .publisher(request.getPublisher())
                    .edition(request.getEdition())
                    .series(request.getSeries())
                    .publicationYear(request.getPublicationYear())
                    .totalPages(request.getTotalPages())
                    .price(request.getPrice())
                    .billNumber(request.getBillNumber())
                    .billDate(request.getBillDate())
                    .branch(request.getBranch())
                    .category(request.getCategory())
                    .language(request.getLanguage())
                    .status("AVAILABLE")
                    .build();

            savedBooks.add(bookRepository.save(book));
        }

        return mapToBookResponse(savedBooks.get(0));
    }

    @Transactional(readOnly = true)
    public List<BookResponse> getAllBooks() {
        return bookRepository.findAll().stream()
                .map(this::mapToBookResponse)
                .collect(Collectors.toList());
    }

    /**
     * Student catalog: one entry per unique ISBN with calculated availability.
     */
    @Transactional(readOnly = true)
    public List<BookCatalogResponse> getCatalogGroupedByIsbn() {
        List<Book> allBooks = bookRepository.findAll();
        Map<String, List<Book>> byIsbn = new LinkedHashMap<>();

        for (Book book : allBooks) {
            if (book.getIsbn() == null || book.getIsbn().isBlank()) {
                continue;
            }
            String key = book.getIsbn().trim();
            byIsbn.computeIfAbsent(key, k -> new ArrayList<>()).add(book);
        }

        return byIsbn.entrySet().stream()
                .map(entry -> mapToCatalogResponse(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(BookCatalogResponse::getTitle, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookCatalogResponse getCatalogBookByIsbn(String isbn) {
        List<Book> list = bookRepository.findByIsbn(isbn);
        if (list.isEmpty()) {
            throw new ResourceNotFoundException("Book not found with ISBN: " + isbn);
        }
        return mapToCatalogResponse(isbn.trim(), list);
    }

    @Transactional(readOnly = true)
    public BookResponse getBookByIsbn(String isbn) {
        List<Book> list = bookRepository.findByIsbn(isbn);
        if (list.isEmpty()) {
            throw new ResourceNotFoundException("Book not found with ISBN: " + isbn);
        }

        Book book = list.stream()
                .filter(b -> "AVAILABLE".equals(b.getStatus()))
                .findFirst()
                .orElse(list.get(0));

        // Public title-level view: omit accession / internal copy identity for students
        BookResponse response = mapToBookResponse(book);
        response.setId(null);
        response.setAccessionNumber(null);
        response.setPrice(null);
        response.setBillNumber(null);
        response.setBillDate(null);
        long available = list.stream().filter(b -> "AVAILABLE".equals(b.getStatus())).count();
        response.setStatus(available > 0 ? "AVAILABLE" : "UNAVAILABLE");
        return response;
    }

    @Transactional(readOnly = true)
    public List<AvailableCopyResponse> getAvailableCopiesByIsbn(String isbn) {
        List<Book> copies = bookRepository.findAllByIsbnAndStatus(isbn, "AVAILABLE");
        return copies.stream()
                .sorted(Comparator.comparing(Book::getAccessionNumber, String.CASE_INSENSITIVE_ORDER))
                .map(b -> AvailableCopyResponse.builder()
                        .id(b.getId())
                        .accessionNumber(b.getAccessionNumber())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public BookResponse updateBook(Long id, BookCreateRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with ID: " + id));

        if (request.getAccessionNumbers() == null || request.getAccessionNumbers().isEmpty()) {
            throw new BadRequestException("Accession number is required");
        }

        String accessionNumber = request.getAccessionNumbers().get(0) == null ? null
                : request.getAccessionNumbers().get(0).trim();
        if (accessionNumber == null || accessionNumber.isEmpty()) {
            throw new BadRequestException("Accession number is required");
        }

        Book existing = bookRepository.findByAccessionNumber(accessionNumber).orElse(null);
        if (existing != null && !existing.getId().equals(id)) {
            throw new BadRequestException("Book with accession number '" + accessionNumber + "' already exists");
        }

        book.setAccessionNumber(accessionNumber);
        book.setIsbn(request.getIsbn());
        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setPublisher(request.getPublisher());
        book.setEdition(request.getEdition());
        book.setSeries(request.getSeries());
        book.setPublicationYear(request.getPublicationYear());
        book.setTotalPages(request.getTotalPages());
        book.setPrice(request.getPrice());
        book.setBillNumber(request.getBillNumber());
        book.setBillDate(request.getBillDate());
        book.setBranch(request.getBranch());
        book.setCategory(request.getCategory());
        book.setLanguage(request.getLanguage());

        return mapToBookResponse(bookRepository.save(book));
    }

    @Transactional
    public BookResponse updateInventory(Long id, int newTotalCopies) {
        throw new BadRequestException("Quantity-based inventory updates are deprecated. Use Add Asset or Delete Copy.");
    }

    @Transactional
    public void deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with ID: " + id));
        if ("BORROWED".equals(book.getStatus())) {
            throw new BadRequestException("Cannot delete book copy that is currently borrowed.");
        }
        bookRepository.delete(book);
    }

    private BookCatalogResponse mapToCatalogResponse(String isbn, List<Book> copies) {
        Book representative = copies.get(0);
        long available = copies.stream().filter(b -> "AVAILABLE".equals(b.getStatus())).count();

        return BookCatalogResponse.builder()
                .isbn(isbn)
                .title(representative.getTitle())
                .author(representative.getAuthor())
                .publisher(representative.getPublisher())
                .edition(representative.getEdition())
                .series(representative.getSeries())
                .publicationYear(representative.getPublicationYear())
                .branch(representative.getBranch())
                .category(representative.getCategory())
                .language(representative.getLanguage())
                .availability(available > 0 ? "Available" : "Unavailable")
                .availableCopies(available)
                .totalCopies(copies.size())
                .build();
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
                .accessionNumber(book.getAccessionNumber())
                .isbn(book.getIsbn())
                .title(book.getTitle())
                .author(book.getAuthor())
                .publisher(book.getPublisher())
                .edition(book.getEdition())
                .series(book.getSeries())
                .publicationYear(book.getPublicationYear())
                .totalPages(book.getTotalPages())
                .price(book.getPrice())
                .billNumber(book.getBillNumber())
                .billDate(book.getBillDate())
                .branch(book.getBranch())
                .category(book.getCategory())
                .language(book.getLanguage())
                .status(book.getStatus())
                .createdAt(book.getCreatedAt())
                .updatedAt(book.getUpdatedAt())
                .build();
    }
}
