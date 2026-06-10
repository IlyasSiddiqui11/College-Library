package com.example.library.repository;

import com.example.library.entity.BorrowRequest;
import com.example.library.enums.BorrowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BorrowRequestRepository extends JpaRepository<BorrowRequest, Long> {
    List<BorrowRequest> findByUserId(Long userId);
    List<BorrowRequest> findByStatus(BorrowStatus status);
    Optional<BorrowRequest> findFirstByUserIdAndBookIsbnAndStatusOrderByRequestDateDesc(Long userId, String isbn, BorrowStatus status);
    Optional<BorrowRequest> findFirstByUserIdAndBookIdAndStatusOrderByRequestDateDesc(Long userId, Long bookId, BorrowStatus status);
}
