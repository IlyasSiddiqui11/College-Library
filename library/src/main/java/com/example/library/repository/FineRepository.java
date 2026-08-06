package com.example.library.repository;

import com.example.library.entity.Fine;
import com.example.library.enums.FineStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FineRepository extends JpaRepository<Fine, Long> {

    List<Fine> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<Fine> findByUserId(Long userId, Pageable pageable);

    boolean existsByUserIdAndStatusIn(Long userId, List<FineStatus> statuses);

    @Query("SELECT f FROM Fine f LEFT JOIN f.borrowRequest br LEFT JOIN br.book bk WHERE " +
           "(:#{#status == null} = true OR f.status = :status) AND " +
           "(:#{#search == null} = true OR LOWER(f.user.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(f.user.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR (bk IS NOT NULL AND LOWER(bk.title) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "OR LOWER(br.isbn) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Fine> searchAndFilterFines(@Param("status") FineStatus status, 
                                    @Param("search") String search, 
                                    Pageable pageable);
                                    
    void deleteByUserId(Long userId);
}
