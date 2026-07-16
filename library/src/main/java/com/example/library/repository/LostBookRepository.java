package com.example.library.repository;

import com.example.library.entity.LostBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LostBookRepository extends JpaRepository<LostBook, Long> {
    Optional<LostBook> findByAccessionNumber(String accessionNumber);
}
