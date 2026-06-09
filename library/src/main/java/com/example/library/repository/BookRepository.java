package com.example.library.repository;

import com.example.library.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    @Query("SELECT b FROM Book b WHERE TRIM(b.isbn) = TRIM(:isbn)")
    Optional<Book> findByIsbn(@Param("isbn") String isbn);
    
    @Query("SELECT COUNT(b) > 0 FROM Book b WHERE TRIM(b.isbn) = TRIM(:isbn)")
    boolean existsByIsbn(@Param("isbn") String isbn);
}
