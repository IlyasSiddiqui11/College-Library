package com.example.library.repository;

import com.example.library.entity.BookReservation;
import com.example.library.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookReservationRepository extends JpaRepository<BookReservation, Long> {

    List<BookReservation> findByUserId(Long userId);

    List<BookReservation> findByUserIdAndStatus(Long userId, ReservationStatus status);

    List<BookReservation> findByIsbnAndStatusOrderByReservationDateAsc(String isbn, ReservationStatus status);

    Optional<BookReservation> findFirstByIsbnAndStatusOrderByReservationDateAsc(String isbn, ReservationStatus status);

    long countByUserIdAndStatus(Long userId, ReservationStatus status);

    boolean existsByUserIdAndIsbnAndStatus(Long userId, String isbn, ReservationStatus status);
}
