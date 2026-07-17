package com.example.library.repository;

import com.example.library.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    
    @Query("SELECT b FROM Book b WHERE TRIM(b.isbn) = TRIM(:isbn)")
    List<Book> findByIsbn(@Param("isbn") String isbn);
    
    @Query("SELECT COUNT(b) > 0 FROM Book b WHERE TRIM(b.isbn) = TRIM(:isbn)")
    boolean existsByIsbn(@Param("isbn") String isbn);

    Optional<Book> findByAccessionNumber(String accessionNumber);

    boolean existsByAccessionNumber(String accessionNumber);

    @Query("SELECT b FROM Book b WHERE TRIM(b.isbn) = TRIM(:isbn) AND b.status = :status")
    List<Book> findAllByIsbnAndStatus(@Param("isbn") String isbn, @Param("status") String status);

    default Optional<Book> findFirstByIsbnAndStatus(String isbn, String status) {
        List<Book> list = findAllByIsbnAndStatus(isbn, status);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}
