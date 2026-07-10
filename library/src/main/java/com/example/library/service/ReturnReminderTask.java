package com.example.library.service;

import com.example.library.entity.BorrowRequest;
import com.example.library.enums.BorrowStatus;
import com.example.library.repository.BorrowRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReturnReminderTask {

    private final BorrowRequestRepository borrowRequestRepository;
    private final EmailService emailService;

    // Run every day at 8:00 AM
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional(readOnly = true)
    public void sendReturnReminders() {
        log.info("Starting scheduled return reminder task...");

        // A book is due 7 days after approval.
        // A reminder 1 day before due date means exactly 6 days after approval.
        // So we want to find books approved 6 days ago.
        LocalDate sixDaysAgoDate = LocalDate.now().minusDays(6);
        LocalDateTime startOfDay = sixDaysAgoDate.atStartOfDay();
        LocalDateTime endOfDay = sixDaysAgoDate.atTime(LocalTime.MAX);

        List<BorrowRequest> upcomingDueRequests = borrowRequestRepository.findByStatusAndApprovedDateBetween(
                BorrowStatus.APPROVED, startOfDay, endOfDay);

        if (upcomingDueRequests.isEmpty()) {
            log.info("No books are due tomorrow. Skipping reminders.");
            return;
        }

        log.info("Found {} books due tomorrow. Sending reminders...", upcomingDueRequests.size());

        for (BorrowRequest request : upcomingDueRequests) {
            String userEmail = request.getUser().getEmail();
            if (userEmail != null && !userEmail.isBlank()) {
                LocalDateTime dueDate = request.getApprovedDate().plusDays(7);
                String subject = "Reminder: Book Due Tomorrow - " + request.getBook().getTitle();
                String body = String.format(
                        "Dear %s,\n\n" +
                                "This is a friendly reminder that the following book borrowed from the College Library is due for return tomorrow.\n\n" +

                                "Book Details:\n" +
                                "----------------------------------------\n" +
                                "Title            : %s\n" +
                                "Author           : %s\n" +
                                "ISBN             : %s\n" +
                                "Accession No.    : %s\n" +
                                "Due Date         : %s\n" +
                                "----------------------------------------\n\n" +

                                "Please return the book on or before the due date to avoid overdue fines or penalties.\n\n" +
                                "Returning books on time helps ensure that other students can also access the library's resources.\n" +

                                "If you have already returned the book, please disregard this reminder.\n\n" +

                                "Thank you for using the College Library Management System.\n\n" +

                                "Best Regards,\n" +
                                "College Library\n" +
                                "Library Management System",

                        request.getUser().getName(),
                        request.getBook().getTitle(),
                        request.getBook().getAuthor(),
                        request.getBook().getIsbn(),
                        request.getAccessionNumber() != null ? request.getAccessionNumber() : "N/A",
                        dueDate.toLocalDate()
                );
                
                emailService.sendEmail(userEmail, subject, body);
            }
        }
        
        log.info("Completed scheduled return reminder task.");
    }
}
