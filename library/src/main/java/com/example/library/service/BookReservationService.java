package com.example.library.service;

import com.example.library.dto.request.ReservationRequestDto;
import com.example.library.entity.Book;
import com.example.library.entity.BookReservation;
import com.example.library.entity.BorrowRequest;
import com.example.library.entity.User;
import com.example.library.dto.response.ReservationResponse;
import com.example.library.enums.BorrowStatus;
import com.example.library.enums.ReservationStatus;
import com.example.library.exception.BadRequestException;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.BookRepository;
import com.example.library.repository.BookReservationRepository;
import com.example.library.repository.BorrowRequestRepository;
import com.example.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookReservationService {

    private final BookReservationRepository bookReservationRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BorrowRequestRepository borrowRequestRepository;
    private final BorrowingService borrowingService;

    @Transactional
    public ReservationResponse createReservation(ReservationRequestDto dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + dto.getUserId()));

        String isbn = dto.getIsbn() != null ? dto.getIsbn().trim() : null;
        if (isbn == null || isbn.isEmpty()) {
            throw new BadRequestException("ISBN is required");
        }

        List<Book> copies = bookRepository.findByIsbn(isbn);
        if (copies.isEmpty()) {
            throw new ResourceNotFoundException("Book not found with ISBN: " + isbn);
        }

        long availableCount = copies.stream().filter(b -> "AVAILABLE".equals(b.getStatus())).count();
        if (availableCount > 0) {
            throw new BadRequestException("Cannot reserve this book as there are available copies.");
        }

        long pendingReservations = bookReservationRepository.countByUserIdAndStatus(user.getId(), ReservationStatus.PENDING);
        if (pendingReservations >= 2) {
            throw new BadRequestException("You have reached the maximum limit of 2 pending reservations.");
        }

        boolean alreadyReserved = bookReservationRepository.existsByUserIdAndIsbnAndStatus(user.getId(), isbn, ReservationStatus.PENDING);
        if (alreadyReserved) {
            throw new BadRequestException("You have already reserved this book.");
        }

        boolean alreadyBorrowed = borrowRequestRepository.findByUserId(user.getId()).stream()
                .anyMatch(req -> {
                    String reqIsbn = req.getIsbn() != null ? req.getIsbn() : (req.getBook() != null ? req.getBook().getIsbn() : null);
                    return isbn.equals(reqIsbn)
                            && (req.getStatus() == BorrowStatus.PENDING || req.getStatus() == BorrowStatus.APPROVED);
                });
        if (alreadyBorrowed) {
            throw new BadRequestException("You already have an active or pending borrow request for this book.");
        }

        Book sampleBook = copies.get(0);

        BookReservation reservation = BookReservation.builder()
                .user(user)
                .isbn(isbn)
                .bookTitle(sampleBook.getTitle())
                .bookAuthor(sampleBook.getAuthor())
                .status(ReservationStatus.PENDING)
                .reservationDate(LocalDateTime.now())
                .build();

        BookReservation saved = bookReservationRepository.save(reservation);

        // Send Email
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            borrowingService.processBookReservationEmail(user.getEmail(), user.getName(), sampleBook.getTitle(), isbn);
        }

        return mapToResponse(saved);
    }

    @Transactional
    public ReservationResponse cancelReservation(Long reservationId, Long userId) {
        BookReservation reservation = bookReservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + reservationId));

        if (!reservation.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only cancel your own reservations.");
        }

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new BadRequestException("Only PENDING reservations can be cancelled.");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        BookReservation saved = bookReservationRepository.save(reservation);
        return mapToResponse(saved);
    }

    @Transactional
    public void fulfillReservation(String isbn) {
        if (isbn == null || isbn.isBlank()) return;

        // Check if there are available copies
        long availableCount = bookRepository.findAllByIsbnAndStatus(isbn, "AVAILABLE").size();
        if (availableCount == 0) return;

        // Find the oldest pending reservation
        Optional<BookReservation> optionalReservation = bookReservationRepository
                .findFirstByIsbnAndStatusOrderByReservationDateAsc(isbn, ReservationStatus.PENDING);

        if (optionalReservation.isEmpty()) return;

        BookReservation reservation = optionalReservation.get();
        User user = reservation.getUser();

        // Check if user already has max active borrows/requests to prevent fulfilling if they hit limits
        long activeBorrowCount = borrowRequestRepository.findByUserId(user.getId()).stream()
                .filter(req -> req.getStatus() == BorrowStatus.APPROVED || req.getStatus() == BorrowStatus.PENDING)
                .count();

        // Check if user already has a pending borrow request for this ISBN
        boolean hasActiveRequest = borrowRequestRepository.findByUserId(user.getId()).stream()
                .anyMatch(req -> {
                    String reqIsbn = resolveIsbn(req);
                    return isbn.equals(reqIsbn)
                            && (req.getStatus() == BorrowStatus.PENDING || req.getStatus() == BorrowStatus.APPROVED);
                });

        if (activeBorrowCount >= 2 || hasActiveRequest) {
            // In a real system we might skip this user and go to the next, 
            // or we might cancel their reservation. Let's just cancel it for now to avoid blocking the queue.
            log.warn("Cannot fulfill reservation for user {} due to limits. Cancelling reservation.", user.getId());
            reservation.setStatus(ReservationStatus.CANCELLED);
            bookReservationRepository.save(reservation);
            
            // Recursively try to fulfill the next one
            fulfillReservation(isbn);
            return;
        }

        // Fulfill reservation -> Create BorrowRequest
        reservation.setStatus(ReservationStatus.FULFILLED);
        reservation.setFulfilledDate(LocalDateTime.now());
        bookReservationRepository.save(reservation);

        BorrowRequest request = BorrowRequest.builder()
                .user(user)
                .book(null)
                .isbn(isbn)
                .status(BorrowStatus.PENDING)
                .accessionNumber(null)
                .requestDate(LocalDateTime.now())
                .build();

        borrowRequestRepository.save(request);

        // Send Email
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            borrowingService.processReservationFulfilledEmail(user.getEmail(), user.getName(), reservation.getBookTitle(), isbn);
        }

        // If there are still available copies (more than 1 returned), we might fulfill more reservations
        if (availableCount > 1) {
            fulfillReservation(isbn);
        }
    }

    private String resolveIsbn(BorrowRequest request) {
        if (request.getIsbn() != null && !request.getIsbn().isBlank()) {
            return request.getIsbn().trim();
        }
        if (request.getBook() != null && request.getBook().getIsbn() != null) {
            return request.getBook().getIsbn().trim();
        }
        return null;
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getAllReservations() {
        return bookReservationRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getUserReservations(Long userId) {
        return bookReservationRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ReservationResponse mapToResponse(BookReservation res) {
        ReservationResponse.UserDto userDto = null;
        if (res.getUser() != null) {
            userDto = ReservationResponse.UserDto.builder()
                    .id(res.getUser().getId())
                    .name(res.getUser().getName())
                    .email(res.getUser().getEmail())
                    .build();
        }

        return ReservationResponse.builder()
                .id(res.getId())
                .user(userDto)
                .isbn(res.getIsbn())
                .bookTitle(res.getBookTitle())
                .bookAuthor(res.getBookAuthor())
                .status(res.getStatus())
                .reservationDate(res.getReservationDate())
                .fulfilledDate(res.getFulfilledDate())
                .createdAt(res.getCreatedAt())
                .updatedAt(res.getUpdatedAt())
                .build();
    }
}
