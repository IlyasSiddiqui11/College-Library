package com.example.library.service;

import lombok.RequiredArgsConstructor;
import com.example.library.dto.request.BorrowRequestDto;
import com.example.library.dto.response.BorrowResponse;
import com.example.library.entity.Book;
import com.example.library.entity.BorrowRequest;
import com.example.library.entity.LostBook;
import com.example.library.entity.User;
import com.example.library.enums.BorrowStatus;
import com.example.library.exception.BadRequestException;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.BookRepository;
import com.example.library.repository.BorrowRequestRepository;
import com.example.library.repository.LostBookRepository;
import com.example.library.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BorrowService {

    private final BorrowRequestRepository borrowRequestRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final BorrowingService borrowingService;
    private final LostBookRepository lostBookRepository;
    
    @Autowired
    @Lazy
    private BookReservationService bookReservationService;

    @Transactional
    public BorrowResponse submitBorrowRequest(BorrowRequestDto dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + dto.getUserId()));

        String isbn = dto.getIsbn() == null ? null : dto.getIsbn().trim();
        if (isbn == null || isbn.isEmpty()) {
            throw new BadRequestException("ISBN is required");
        }

        List<Book> copies = bookRepository.findByIsbn(isbn);
        if (copies.isEmpty()) {
            throw new ResourceNotFoundException("Book not found with ISBN: " + isbn);
        }

        boolean hasAvailableCopy = copies.stream().anyMatch(b -> "AVAILABLE".equals(b.getStatus()));
        if (!hasAvailableCopy) {
            throw new BadRequestException("No available copies found for ISBN: " + isbn);
        }

        // Check active request for this ISBN (title-level, not physical copy)
        boolean hasActiveRequest = borrowRequestRepository.findByUserId(user.getId()).stream()
                .anyMatch(req -> {
                    String reqIsbn = resolveIsbn(req);
                    return isbn.equals(reqIsbn)
                            && (req.getStatus() == BorrowStatus.PENDING || req.getStatus() == BorrowStatus.APPROVED);
                });

        if (hasActiveRequest) {
            throw new BadRequestException("You already have a pending or approved borrow request for this book");
        }

        long activeBorrowCount = borrowRequestRepository.findByUserId(user.getId()).stream()
                .filter(req -> req.getStatus() == BorrowStatus.APPROVED || req.getStatus() == BorrowStatus.PENDING)
                .count();

        if (activeBorrowCount >= 2) {
            throw new BadRequestException(
                    "Borrow limit reached: students may only borrow up to 2 books simultaneously.");
        }

        // Title-level request: do NOT reserve a physical copy or set accession until admin approves
        BorrowRequest request = BorrowRequest.builder()
                .user(user)
                .book(null)
                .isbn(isbn)
                .status(BorrowStatus.PENDING)
                .accessionNumber(null)
                .requestDate(LocalDateTime.now())
                .build();

        BorrowRequest savedRequest = borrowRequestRepository.save(request);
        return mapToBorrowResponse(savedRequest, copies.get(0));
    }

    @Transactional
    public BorrowResponse approveBorrowRequest(Long requestId, String accessionNumber) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Borrow request not found with ID: " + requestId));

        if (request.getStatus() != BorrowStatus.PENDING) {
            throw new BadRequestException(
                    "Borrow request must be in PENDING status to be approved. Current status: " + request.getStatus());
        }

        long approvedCount = borrowRequestRepository.findByUserId(request.getUser().getId()).stream()
                .filter(req -> req.getStatus() == BorrowStatus.APPROVED)
                .count();
        if (approvedCount >= 2) {
            throw new BadRequestException("Borrow limit reached: User already has 2 active borrowed books. They must return one before this request can be approved.");
        }

        if (accessionNumber == null || accessionNumber.isBlank()) {
            throw new BadRequestException("Accession number is required to approve a borrow request.");
        }

        String normalizedAccession = accessionNumber.trim();
        Book selectedCopy = bookRepository.findByAccessionNumber(normalizedAccession)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Book copy not found with Accession Number: " + normalizedAccession));

        String requestIsbn = resolveIsbn(request);
        if (requestIsbn != null && selectedCopy.getIsbn() != null
                && !requestIsbn.trim().equalsIgnoreCase(selectedCopy.getIsbn().trim())) {
            throw new BadRequestException(
                    "Selected accession '" + normalizedAccession + "' does not match the requested ISBN.");
        }

        if (!"AVAILABLE".equals(selectedCopy.getStatus())) {
            throw new BadRequestException(
                    "Selected book copy '" + normalizedAccession + "' is not available.");
        }

        // Release any previously reserved copy (legacy pending requests)
        Book previousBook = request.getBook();
        if (previousBook != null && !previousBook.getId().equals(selectedCopy.getId())
                && "BORROWED".equals(previousBook.getStatus())) {
            previousBook.setStatus("AVAILABLE");
            bookRepository.save(previousBook);
        }

        selectedCopy.setStatus("BORROWED");
        bookRepository.save(selectedCopy);

        LocalDateTime approvedAt = LocalDateTime.now();
        request.setBook(selectedCopy);
        request.setIsbn(selectedCopy.getIsbn());
        request.setAccessionNumber(selectedCopy.getAccessionNumber());
        request.setStatus(BorrowStatus.APPROVED);
        request.setApprovedDate(approvedAt);
        request.setDueDate(approvedAt.plusDays(7));

        BorrowRequest approvedRequest = borrowRequestRepository.save(request);

        String userEmail = approvedRequest.getUser().getEmail();
        if (userEmail != null && !userEmail.isBlank()) {
            LocalDate issueDate = approvedAt.toLocalDate();
            LocalDate dueDate = issueDate.plusDays(7);
            borrowingService.processBookApproval(
                    userEmail,
                    approvedRequest.getUser().getName(),
                    selectedCopy.getTitle(),
                    selectedCopy.getAuthor(),
                    selectedCopy.getIsbn(),
                    issueDate,
                    dueDate);
        }

        return mapToBorrowResponse(approvedRequest, selectedCopy);
    }

    @Transactional
    public BorrowResponse rejectBorrowRequest(Long requestId) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Borrow request not found with ID: " + requestId));

        if (request.getStatus() != BorrowStatus.PENDING) {
            throw new BadRequestException(
                    "Borrow request must be in PENDING status to be rejected. Current status: " + request.getStatus());
        }

        // Revert only if a copy was pre-reserved (legacy behavior)
        Book book = request.getBook();
        if (book != null && "BORROWED".equals(book.getStatus())
                && (request.getAccessionNumber() != null
                        && request.getAccessionNumber().equals(book.getAccessionNumber()))) {
            book.setStatus("AVAILABLE");
            bookRepository.save(book);
        }

        request.setStatus(BorrowStatus.REJECTED);
        BorrowRequest rejectedRequest = borrowRequestRepository.save(request);

        // If a request is rejected, a copy might be available now or was available before
        String resolvedIsbn = resolveIsbn(rejectedRequest);
        if (resolvedIsbn != null) {
            bookReservationService.fulfillReservation(resolvedIsbn);
        }

        return mapToBorrowResponse(rejectedRequest, book);
    }

    @Transactional
    public BorrowResponse cancelBorrowRequest(Long requestId, Long userId) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Borrow request not found with ID: " + requestId));

        if (!request.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only cancel your own borrow requests.");
        }

        if (request.getStatus() != BorrowStatus.PENDING) {
            throw new BadRequestException(
                    "Only PENDING requests can be cancelled. Current status: " + request.getStatus());
        }

        Book book = request.getBook();
        if (book != null && "BORROWED".equals(book.getStatus())
                && (request.getAccessionNumber() != null
                        && request.getAccessionNumber().equals(book.getAccessionNumber()))) {
            book.setStatus("AVAILABLE");
            bookRepository.save(book);
        }

        request.setStatus(BorrowStatus.CANCELLED);
        BorrowRequest cancelledRequest = borrowRequestRepository.save(request);

        // If a request is cancelled, a copy might be available now or was available before
        String resolvedIsbn = resolveIsbn(cancelledRequest);
        if (resolvedIsbn != null) {
            bookReservationService.fulfillReservation(resolvedIsbn);
        }

        return mapToBorrowResponse(cancelledRequest, book);
    }

    @Transactional
    public BorrowResponse returnBook(Long userId, String accessionNumber) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        BorrowRequest request = borrowRequestRepository
                .findFirstByUserIdAndAccessionNumberAndStatusOrderByRequestDateDesc(user.getId(), accessionNumber,
                        BorrowStatus.APPROVED)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active approved borrow request found for student ID: " + userId
                                + " and Accession Number: " + accessionNumber));

        Book book = request.getBook();
        if (book != null) {
            book.setStatus("AVAILABLE");
            bookRepository.save(book);
        }

        request.setStatus(BorrowStatus.RETURNED);
        request.setReturnedDate(LocalDateTime.now());
        BorrowRequest returnedRequest = borrowRequestRepository.save(request);

        String userEmail = returnedRequest.getUser().getEmail();
        if (userEmail != null && !userEmail.isBlank()) {
            String title = book != null ? book.getTitle() : "Unknown Book";
            String author = book != null ? book.getAuthor() : "Unknown Author";
            String isbn = book != null ? book.getIsbn() : resolveIsbn(request);

            if (book == null && request.getAccessionNumber() != null) {
                LostBook lost = lostBookRepository.findByAccessionNumber(request.getAccessionNumber()).orElse(null);
                if (lost != null) {
                    title = lost.getTitle();
                    author = lost.getAuthor();
                    isbn = lost.getIsbn();
                }
            }

            borrowingService.processBookReturn(
                    userEmail,
                    returnedRequest.getUser().getName(),
                    title,
                    author,
                    isbn,
                    returnedRequest.getReturnedDate().toLocalDate());
        }

        // Fulfill any pending reservations for this ISBN since a copy is now available
        String resolvedIsbn = book != null ? book.getIsbn() : resolveIsbn(request);
        if (resolvedIsbn != null) {
            bookReservationService.fulfillReservation(resolvedIsbn);
        }

        return mapToBorrowResponse(returnedRequest, book);
    }

    @Transactional
    public BorrowResponse extendBookAdmin(Long userId, String accessionNumber) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        BorrowRequest request = borrowRequestRepository
                .findFirstByUserIdAndAccessionNumberAndStatusOrderByRequestDateDesc(user.getId(), accessionNumber,
                        BorrowStatus.APPROVED)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active approved borrow request found for student ID: " + userId
                                + " and Accession Number: " + accessionNumber));

        if (request.getExtensionCount() >= 2) {
            throw new BadRequestException("This book has already been extended the maximum number of times (2)");
        }

        LocalDateTime newDueDate = request.getDueDate() != null 
            ? request.getDueDate().plusDays(7) 
            : request.getApprovedDate().plusDays(14);
            
        request.setDueDate(newDueDate);
        request.setExtensionCount(request.getExtensionCount() + 1);
        
        BorrowRequest saved = borrowRequestRepository.save(request);
        return mapToBorrowResponse(saved, saved.getBook());
    }

    @Transactional(readOnly = true)
    public List<BorrowResponse> getAllRequests() {
        return borrowRequestRepository.findAll().stream()
                .map(req -> mapToBorrowResponse(req, req.getBook()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BorrowResponse> getRequestsByStatus(BorrowStatus status) {
        return borrowRequestRepository.findByStatus(status).stream()
                .map(req -> mapToBorrowResponse(req, req.getBook()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BorrowResponse> getRequestsByUserId(Long userId) {
        return borrowRequestRepository.findByUserId(userId).stream()
                .map(req -> mapToBorrowResponse(req, req.getBook()))
                .collect(Collectors.toList());
    }

    @Transactional
    public BorrowResponse extendBorrow(Long requestId, Long userId) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Borrow request not found"));

        if (!request.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only extend your own borrowed books");
        }

        if (request.getStatus() != BorrowStatus.APPROVED) {
            throw new BadRequestException("Only approved (active) borrows can be extended");
        }

        if (request.getExtensionCount() >= 2) {
            throw new BadRequestException("You can only extend a book up to 2 times");
        }

        LocalDateTime newDueDate = request.getDueDate() != null 
            ? request.getDueDate().plusDays(7) 
            : request.getApprovedDate().plusDays(7).plusDays(7);
            
        request.setDueDate(newDueDate);
        request.setExtensionCount(request.getExtensionCount() + 1);
        
        BorrowRequest saved = borrowRequestRepository.save(request);
        return mapToBorrowResponse(saved, saved.getBook());
    }

    private String resolveIsbn(BorrowRequest request) {
        if (request.getIsbn() != null && !request.getIsbn().isBlank()) {
            return request.getIsbn().trim();
        }
        if (request.getBook() != null && request.getBook().getIsbn() != null) {
            return request.getBook().getIsbn().trim();
        }
        if (request.getAccessionNumber() != null) {
            LostBook lost = lostBookRepository.findByAccessionNumber(request.getAccessionNumber()).orElse(null);
            if (lost != null && lost.getIsbn() != null) {
                return lost.getIsbn().trim();
            }
        }
        return null;
    }

    private BorrowResponse mapToBorrowResponse(BorrowRequest request, Book bookHint) {
        LocalDateTime dueDate = request.getDueDate() != null
                ? request.getDueDate()
                : (request.getApprovedDate() != null ? request.getApprovedDate().plusDays(7) : null);

        Long bookId = null;
        String bookTitle = "Unknown Book";
        String bookAuthor = "Unknown Author";
        String isbn = resolveIsbn(request);
        String edition = null;
        String branch = null;
        String category = null;

        Book book = bookHint != null ? bookHint : request.getBook();

        if (book == null && isbn != null) {
            List<Book> copies = bookRepository.findByIsbn(isbn);
            if (!copies.isEmpty()) {
                book = copies.get(0);
            }
        }

        if (book != null) {
            bookId = request.getBook() != null ? request.getBook().getId() : null;
            bookTitle = book.getTitle();
            bookAuthor = book.getAuthor();
            isbn = book.getIsbn();
            edition = book.getEdition();
            branch = book.getBranch();
            category = book.getCategory();
        } else if (request.getAccessionNumber() != null) {
            LostBook lost = lostBookRepository.findByAccessionNumber(request.getAccessionNumber()).orElse(null);
            if (lost != null) {
                bookId = lost.getBookId();
                bookTitle = lost.getTitle();
                bookAuthor = lost.getAuthor();
                isbn = lost.getIsbn();
                edition = lost.getEdition();
                branch = lost.getBranch();
                category = lost.getCategory();
            }
        }

        long availableCopies = 0;
        if (isbn != null) {
            availableCopies = bookRepository.findAllByIsbnAndStatus(isbn, "AVAILABLE").size();
        }

        return BorrowResponse.builder()
                .id(request.getId())
                .userId(request.getUser().getId())
                .userName(request.getUser().getName())
                .bookId(bookId)
                .bookTitle(bookTitle)
                .bookAuthor(bookAuthor)
                .isbn(isbn)
                .edition(edition)
                .branch(branch)
                .category(category)
                .status(request.getStatus())
                .requestDate(request.getRequestDate())
                .approvedDate(request.getApprovedDate())
                .dueDate(dueDate)
                .returnedDate(request.getReturnedDate())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .accessionNumber(request.getAccessionNumber())
                .availableCopies(availableCopies)
                .extensionCount(request.getExtensionCount())
                .build();
    }
}
