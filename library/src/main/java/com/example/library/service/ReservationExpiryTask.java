package com.example.library.service;

import com.example.library.entity.BookReservation;
import com.example.library.enums.ReservationStatus;
import com.example.library.repository.BookReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * RULES.md §10.8 — EXPIRED status:
 * A reservation became invalid according to the configured workflow.
 *
 * Runs daily at midnight. Marks PENDING reservations older than 7 days
 * as EXPIRED, keeping the FIFO queue clean.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationExpiryTask {

    private static final int EXPIRY_DAYS = 7;

    private final BookReservationRepository bookReservationRepository;

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void expireStaleReservations() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(EXPIRY_DAYS);

        List<BookReservation> stale = bookReservationRepository
                .findByStatusAndReservationDateBefore(ReservationStatus.PENDING, cutoff);

        if (stale.isEmpty()) {
            log.info("[ReservationExpiry] No stale reservations found.");
            return;
        }

        log.info("[ReservationExpiry] Expiring {} stale PENDING reservation(s) older than {} days.",
                stale.size(), EXPIRY_DAYS);

        for (BookReservation reservation : stale) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            bookReservationRepository.save(reservation);
            log.info("[ReservationExpiry] Expired reservation ID={} user={} isbn={}",
                    reservation.getId(), reservation.getUser().getId(), reservation.getIsbn());
        }

        log.info("[ReservationExpiry] Done. {} reservation(s) marked as EXPIRED.", stale.size());
    }
}
