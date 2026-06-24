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
                String body = String.format("Hello %s,\n\n" +
                        "This is a friendly reminder that the book you borrowed ('%s') is due tomorrow, %s.\n\n" +
                        "Please ensure it is returned on time to avoid any penalties.\n\n" +
                        "Thank you,\nLibrary Management",
                        request.getUser().getName(),
                        request.getBook().getTitle(),
                        dueDate.toLocalDate().toString());
                
                emailService.sendEmail(userEmail, subject, body);
            }
        }
        
        log.info("Completed scheduled return reminder task.");
    }
}
