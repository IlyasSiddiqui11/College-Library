package com.example.library.service;

import com.example.library.dto.response.ReplacementResponse;
import com.example.library.entity.Book;
import com.example.library.entity.BookReplacement;
import com.example.library.entity.User;
import com.example.library.repository.BookReplacementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;
import jakarta.annotation.PostConstruct;
import com.example.library.repository.BookRepository;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class BookReplacementService {

    private final BookReplacementRepository replacementRepository;
    private final BookRepository bookRepository;

    @PostConstruct
    @Transactional
    public void syncLegacyReplacements() {
        List<Book> replacedBooks = bookRepository.findByStatus("REPLACED");

        for (Book original : replacedBooks) {
            String replacementAcc = original.getAccessionNumber() + "-R";
            Optional<Book> replacementBookOpt = bookRepository.findByAccessionNumber(replacementAcc);
            
            if (replacementBookOpt.isPresent()) {
                Book replacementBook = replacementBookOpt.get();
                // Check if it's already in the replacement table
                boolean exists = replacementRepository.existsByOriginalBookId(original.getId());
                
                if (!exists) {
                    BookReplacement record = BookReplacement.builder()
                            .originalBook(original)
                            .replacementBook(replacementBook)
                            .replacedByAdmin("System Sync")
                            .replacementDate(LocalDateTime.now())
                            .remarks("Legacy replacement synced on startup")
                            .build();
                    replacementRepository.save(record);
                    System.out.println("Synced legacy replacement for " + original.getAccessionNumber());
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<ReplacementResponse> getAllReplacements() {
        return replacementRepository.findAllByOrderByReplacementDateDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReplacementResponse> getReplacementsByUser(Long userId) {
        return replacementRepository.findByStudentIdOrderByReplacementDateDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ReplacementResponse mapToResponse(BookReplacement replacement) {
        Book original = replacement.getOriginalBook();
        Book newBook = replacement.getReplacementBook();
        User student = replacement.getStudent();

        return ReplacementResponse.builder()
                .id(replacement.getId())
                .originalBookId(original != null ? original.getId() : null)
                .originalAccessionNumber(original != null ? original.getAccessionNumber() : null)
                .originalIsbn(original != null ? original.getIsbn() : null)
                .originalTitle(original != null ? original.getTitle() : null)
                .originalAuthor(original != null ? original.getAuthor() : null)
                .originalPublisher(original != null ? original.getPublisher() : null)
                .originalEdition(original != null ? original.getEdition() : null)
                .originalCategory(original != null ? original.getCategory() : null)
                .originalStatus(original != null ? original.getStatus() : null)
                .replacementBookId(newBook != null ? newBook.getId() : null)
                .replacementAccessionNumber(newBook != null ? newBook.getAccessionNumber() : null)
                .replacementIsbn(newBook != null ? newBook.getIsbn() : null)
                .replacementTitle(newBook != null ? newBook.getTitle() : null)
                .replacementAuthor(newBook != null ? newBook.getAuthor() : null)
                .replacementPublisher(newBook != null ? newBook.getPublisher() : null)
                .replacementEdition(newBook != null ? newBook.getEdition() : null)
                .replacementCategory(newBook != null ? newBook.getCategory() : null)
                .replacementStatus(newBook != null ? newBook.getStatus() : null)
                .studentId(student != null ? student.getId() : null)
                .userRole(student != null ? student.getRole() : null)
                .studentName(student != null ? student.getName() : "Unknown")
                .replacedByAdmin(replacement.getReplacedByAdmin())
                .replacementDate(replacement.getReplacementDate())
                .remarks(replacement.getRemarks())
                .build();
    }
}
