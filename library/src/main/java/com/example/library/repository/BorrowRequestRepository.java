package com.example.library.repository;

import com.example.library.entity.BorrowRequest;
import com.example.library.enums.BorrowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BorrowRequestRepository extends JpaRepository<BorrowRequest, Long> {
    List<BorrowRequest> findByUserId(Long userId);

    List<BorrowRequest> findByStatus(BorrowStatus status);

    Optional<BorrowRequest> findFirstByUserIdAndBookIsbnAndStatusOrderByRequestDateDesc(Long userId, String isbn,
            BorrowStatus status);

    Optional<BorrowRequest> findFirstByUserIdAndBookIdAndStatusOrderByRequestDateDesc(Long userId, Long bookId,
            BorrowStatus status);

    boolean existsByAccessionNumberAndStatus(String accessionNumber, BorrowStatus status);
    List<BorrowRequest> findByBookIsbnAndStatusOrderByRequestDateAsc(String isbn, BorrowStatus status);

    Optional<BorrowRequest> findFirstByAccessionNumberAndStatusOrderByRequestDateDesc(String accessionNumber,
            BorrowStatus status);

    Optional<BorrowRequest> findByUserIdAndAccessionNumberAndStatus(Long userId, String accessionNumber,
            BorrowStatus status);

    Optional<BorrowRequest> findFirstByUserIdAndAccessionNumberAndStatusOrderByRequestDateDesc(Long userId,
            String accessionNumber, BorrowStatus status);

    @Query("SELECT b FROM BorrowRequest b WHERE b.status = :status AND b.approvedDate >= :start AND b.approvedDate <= :end")
    List<BorrowRequest> findByStatusAndApprovedDateBetween(
            @Param("status") BorrowStatus status,
            @Param("start") java.time.LocalDateTime start,
            @Param("end") java.time.LocalDateTime end);
}
