package com.example.library.service;

import lombok.RequiredArgsConstructor;

import com.example.library.dto.request.BorrowRequestDto;
import com.example.library.dto.response.BorrowResponse;
import com.example.library.entity.Book;
import com.example.library.entity.BorrowRequest;
import com.example.library.entity.User;
import com.example.library.enums.BorrowStatus;
import com.example.library.exception.BadRequestException;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.BookRepository;
import com.example.library.repository.BorrowRequestRepository;
import com.example.library.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public BorrowResponse submitBorrowRequest(BorrowRequestDto dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + dto.getUserId()));

        Book book = bookRepository.findByIsbn(dto.getIsbn())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with ISBN: " + dto.getIsbn()));

        // Check if there is an active (PENDING or APPROVED) request for this book by
        // this user
        boolean hasActiveRequest = borrowRequestRepository.findByUserId(user.getId()).stream()
                .anyMatch(req -> req.getBook().getId().equals(book.getId()) &&
                        (req.getStatus() == BorrowStatus.PENDING || req.getStatus() == BorrowStatus.APPROVED));

        if (hasActiveRequest) {
            throw new BadRequestException("You already have a pending or approved borrow request for this book");
        }

        // Enforce simultaneous borrow limit: max 2 books at a time
        long activeBorrowCount = borrowRequestRepository.findByUserId(user.getId()).stream()
                .filter(req -> req.getStatus() == BorrowStatus.APPROVED || req.getStatus() == BorrowStatus.PENDING)
                .count();

        if (activeBorrowCount >= 2) {
            throw new BadRequestException(
                    "Borrow limit reached: students may only borrow up to 2 books simultaneously.");
        }

        BorrowRequest request = BorrowRequest.builder()
                .user(user)
                .book(book)
                .status(BorrowStatus.PENDING)
                .requestDate(LocalDateTime.now())
                .build();

        BorrowRequest savedRequest = borrowRequestRepository.save(request);
        return mapToBorrowResponse(savedRequest);
    }

    @Transactional
    public BorrowResponse approveBorrowRequest(Long requestId, String accessionNumber) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Borrow request not found with ID: " + requestId));

        if (request.getStatus() != BorrowStatus.PENDING) {
            throw new BadRequestException(
                    "Borrow request must be in PENDING status to be approved. Current status: " + request.getStatus());
        }

        Book book = request.getBook();
        if (book.getAvailableCopies() <= 0) {
            throw new BadRequestException("No copies available of book: " + book.getTitle());
        }

        // Validate accession number uniqueness: cannot be assigned to another active
        // loan
        if (accessionNumber != null && !accessionNumber.isBlank()) {
            boolean accessionInUse = borrowRequestRepository.existsByAccessionNumberAndStatus(accessionNumber,
                    BorrowStatus.APPROVED);
            if (accessionInUse) {
                throw new BadRequestException("Accession number '" + accessionNumber
                        + "' is already assigned to another active borrow. Please use a different accession number.");
            }
        }

        // Safely decrement available copies
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        request.setStatus(BorrowStatus.APPROVED);
        request.setApprovedDate(LocalDateTime.now());
        request.setAccessionNumber(accessionNumber);
        BorrowRequest approvedRequest = borrowRequestRepository.save(request);

        // Send approval email via shared borrowing mail service
        String userEmail = approvedRequest.getUser().getEmail();
        if (userEmail != null && !userEmail.isBlank()) {
            LocalDate issueDate = approvedRequest.getApprovedDate().toLocalDate();
            LocalDate dueDate = issueDate.plusDays(7);
            borrowingService.processBookApproval(
                    userEmail,
                    approvedRequest.getUser().getName(),
                    book.getTitle(),
                    book.getAuthor(),
                    book.getIsbn(),
                    issueDate,
                    dueDate);
        }

        return mapToBorrowResponse(approvedRequest);
    }

    @Transactional
    public BorrowResponse rejectBorrowRequest(Long requestId) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Borrow request not found with ID: " + requestId));

        if (request.getStatus() != BorrowStatus.PENDING) {
            throw new BadRequestException(
                    "Borrow request must be in PENDING status to be rejected. Current status: " + request.getStatus());
        }

        request.setStatus(BorrowStatus.REJECTED);
        BorrowRequest rejectedRequest = borrowRequestRepository.save(request);

        return mapToBorrowResponse(rejectedRequest);
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

        request.setStatus(BorrowStatus.CANCELLED);
        BorrowRequest cancelledRequest = borrowRequestRepository.save(request);

        return mapToBorrowResponse(cancelledRequest);
    }

    @Transactional
    public BorrowResponse returnBook(Long userId, String isbn, String accessionNumber) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        BorrowRequest request = borrowRequestRepository
                .findFirstByUserIdAndBookIsbnAndStatusOrderByRequestDateDesc(user.getId(), isbn, BorrowStatus.APPROVED)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active approved borrow request found for user ID: " + userId + " and book ISBN: " + isbn));

        if (request.getAccessionNumber() != null && !request.getAccessionNumber().equals(accessionNumber)) {
            throw new BadRequestException("Returned book accession number does not match the borrowed book. Expected: "
                    + request.getAccessionNumber() + ", Provided: " + accessionNumber);
        }

        Book book = request.getBook();
        // Increment available copies
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);

        request.setStatus(BorrowStatus.RETURNED);
        request.setReturnedDate(LocalDateTime.now());
        BorrowRequest returnedRequest = borrowRequestRepository.save(request);

        // Send return confirmation email via shared borrowing mail service
        String userEmail = returnedRequest.getUser().getEmail();
        if (userEmail != null && !userEmail.isBlank()) {
            borrowingService.processBookReturn(
                    userEmail,
                    returnedRequest.getUser().getName(),
                    book.getTitle(),
                    book.getAuthor(),
                    book.getIsbn(),
                    returnedRequest.getReturnedDate().toLocalDate());
        }

        return mapToBorrowResponse(returnedRequest);
    }

    @Transactional(readOnly = true)
    public List<BorrowResponse> getAllRequests() {
        return borrowRequestRepository.findAll().stream()
                .map(this::mapToBorrowResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BorrowResponse> getRequestsByStatus(BorrowStatus status) {
        return borrowRequestRepository.findByStatus(status).stream()
                .map(this::mapToBorrowResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BorrowResponse> getRequestsByUserId(Long userId) {
        return borrowRequestRepository.findByUserId(userId).stream()
                .map(this::mapToBorrowResponse)
                .collect(Collectors.toList());
    }

    private BorrowResponse mapToBorrowResponse(BorrowRequest request) {
        LocalDateTime dueDate = request.getApprovedDate() != null
                ? request.getApprovedDate().plusDays(7)
                : null;
        return BorrowResponse.builder()
                .id(request.getId())
                .userId(request.getUser().getId())
                .userName(request.getUser().getName())
                .bookId(request.getBook().getId())
                .bookTitle(request.getBook().getTitle())
                .bookAuthor(request.getBook().getAuthor())
                .isbn(request.getBook().getIsbn())
                .status(request.getStatus())
                .requestDate(request.getRequestDate())
                .approvedDate(request.getApprovedDate())
                .dueDate(dueDate)
                .returnedDate(request.getReturnedDate())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .accessionNumber(request.getAccessionNumber())
                .build();
    }
}
