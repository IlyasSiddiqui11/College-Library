package com.example.library.service;

import lombok.RequiredArgsConstructor;
import com.example.library.dto.request.LostBookReportRequest;
import com.example.library.dto.response.LostBookDetailsResponse;
import com.example.library.entity.Book;
import com.example.library.entity.BorrowRequest;
import com.example.library.entity.LostBook;
import com.example.library.entity.StudentProfile;
import com.example.library.enums.BorrowStatus;
import com.example.library.exception.BadRequestException;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.BookRepository;
import com.example.library.repository.BorrowRequestRepository;
import com.example.library.repository.LostBookRepository;
import com.example.library.repository.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LostBookService {

        private final BookRepository bookRepository;
        private final BorrowRequestRepository borrowRequestRepository;
        private final StudentProfileRepository studentProfileRepository;
        private final LostBookRepository lostBookRepository;

        @Lazy
        @Autowired
        private FineService fineService;

        @Transactional(readOnly = true)
        public LostBookDetailsResponse getLostBookDetails(String accessionNumber) {
                Book book = bookRepository.findByAccessionNumber(accessionNumber.trim())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Book copy not found with Accession Number: " + accessionNumber));

                BorrowRequest borrowRequest = borrowRequestRepository
                                .findFirstByAccessionNumberAndStatusOrderByRequestDateDesc(accessionNumber.trim(),
                                                BorrowStatus.APPROVED)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "No active approved borrow request found for Accession Number: "
                                                                + accessionNumber));

                StudentProfile profile = studentProfileRepository.findByUserId(borrowRequest.getUser().getId())
                                .orElse(null);

                return LostBookDetailsResponse.builder()
                                .bookId(book.getId())
                                .accessionNumber(book.getAccessionNumber())
                                .isbn(book.getIsbn())
                                .title(book.getTitle())
                                .author(book.getAuthor())
                                .publisher(book.getPublisher())
                                .edition(book.getEdition())
                                .series(book.getSeries())
                                .publicationYear(book.getPublicationYear())
                                .bookBranch(book.getBranch())
                                .bookCategory(book.getCategory())
                                .price(book.getPrice())
                                .studentId(borrowRequest.getUser().getId())
                                .studentName(borrowRequest.getUser().getName())
                                .studentEmail(borrowRequest.getUser().getEmail())
                                .studentBranch(profile != null ? profile.getBranch() : "N/A")
                                .studentYear(profile != null ? String.valueOf(profile.getYear()) : "N/A")
                                .borrowRequestId(borrowRequest.getId())
                                .borrowDate(borrowRequest.getApprovedDate())
                                .dueDate(borrowRequest.getDueDate() != null
                                                ? borrowRequest.getDueDate()
                                                : (borrowRequest.getApprovedDate() != null
                                                                ? borrowRequest.getApprovedDate().plusDays(7)
                                                                : null))
                                .build();
        }

        @Transactional
        public LostBook reportLostBook(LostBookReportRequest reportRequest) {
                String accessionNumber = reportRequest.getAccessionNumber().trim();

                Book book = bookRepository.findByAccessionNumber(accessionNumber)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Book copy not found with Accession Number: " + accessionNumber));

                BorrowRequest borrowRequest = borrowRequestRepository
                                .findFirstByAccessionNumberAndStatusOrderByRequestDateDesc(accessionNumber,
                                                BorrowStatus.APPROVED)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "No active approved borrow request found for Accession Number: "
                                                                + accessionNumber));

                StudentProfile profile = studentProfileRepository.findByUserId(borrowRequest.getUser().getId())
                                .orElse(null);

                // Copy all information to LostBook
                LostBook lostBook = LostBook.builder()
                                .bookId(book.getId())
                                .borrowRequestId(borrowRequest.getId())
                                .studentId(borrowRequest.getUser().getId())
                                .accessionNumber(book.getAccessionNumber())
                                .isbn(book.getIsbn())
                                .title(book.getTitle())
                                .author(book.getAuthor())
                                .publisher(book.getPublisher())
                                .edition(book.getEdition())
                                .series(book.getSeries())
                                .publicationYear(book.getPublicationYear())
                                .price(book.getPrice())
                                .branch(book.getBranch())
                                .category(book.getCategory())
                                .studentName(borrowRequest.getUser().getName())
                                .studentEmail(borrowRequest.getUser().getEmail())
                                .studentBranch(profile != null ? profile.getBranch() : "N/A")
                                .studentYear(profile != null ? String.valueOf(profile.getYear()) : "N/A")
                                .borrowDate(borrowRequest.getApprovedDate())
                                .dueDate(borrowRequest.getDueDate() != null
                                                ? borrowRequest.getDueDate()
                                                : (borrowRequest.getApprovedDate() != null
                                                                ? borrowRequest.getApprovedDate().plusDays(7)
                                                                : null))
                                .reason(reportRequest.getReason())
                                .remarks(reportRequest.getRemarks())
                                .reportedAt(LocalDateTime.now())
                                .reportedByAdmin(reportRequest.getReportedByAdmin() != null
                                                ? reportRequest.getReportedByAdmin()
                                                : "Admin")
                                .build();

                // 1. Save LostBook record
                LostBook savedLostBook = lostBookRepository.save(lostBook);

                // Capture book price before deleting the book entity
                Double bookPrice = book.getPrice();

                // 2. Update APPROVED Borrow Request status to LOST
                borrowRequest.setStatus(BorrowStatus.LOST);
                borrowRequestRepository.save(borrowRequest);

                // 3. Update physical book status to LOST
                book.setStatus("LOST");
                bookRepository.save(book);

                // 4. Generate fine
                try {
                        fineService.generateLostBookFine(borrowRequest, bookPrice);
                } catch (Exception e) {
                        // Log but don't fail the whole operation — fine can be added manually
                        System.err.println("[LostBookService] Failed to generate fine for lost book: " + e.getMessage());
                        e.printStackTrace();
                }

                return savedLostBook;
        }

        @Transactional(readOnly = true)
        public List<LostBook> getAllLostBooks() {
                return lostBookRepository.findAll();
        }
}
