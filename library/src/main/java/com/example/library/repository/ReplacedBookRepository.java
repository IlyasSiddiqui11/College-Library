package com.example.library.repository;

import com.example.library.entity.ReplacedBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReplacedBookRepository extends JpaRepository<ReplacedBook, Long> {
}
