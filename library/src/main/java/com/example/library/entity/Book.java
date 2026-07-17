package com.example.library.entity;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Data;

@Entity
@Table(name = "books")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "accession_number", nullable = false, unique = true)
    private String accessionNumber;

    @Column(nullable = false)
    private String isbn;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @Column(name = "publisher")
    private String publisher;

    @Column(name = "edition")
    private String edition;

    @Column(name = "series")
    private String series;

    @Column(name = "publication_year")
    private Integer publicationYear;

    @Column(name = "total_pages")
    private Integer totalPages;

    @Column(name = "price")
    private Double price;

    @Column(name = "bill_number")
    private String billNumber;

    @Column(name = "bill_date")
    private LocalDate billDate;

    @Column(name = "branch")
    private String branch;

    @Column(name = "category")
    private String category;

    @Column(name = "language")
    private String language;

    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "AVAILABLE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "AVAILABLE";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
