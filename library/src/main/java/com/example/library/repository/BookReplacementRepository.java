package com.example.library.repository;

import com.example.library.entity.BookReplacement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookReplacementRepository extends JpaRepository<BookReplacement, Long> {
    List<BookReplacement> findByStudentIdOrderByReplacementDateDesc(Long studentId);
    List<BookReplacement> findAllByOrderByReplacementDateDesc();
    boolean existsByOriginalBookId(Long originalBookId);
}
