package com.example.library.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "book_replacements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookReplacement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_book_id", nullable = false)
    private Book originalBook;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replacement_book_id", nullable = false)
    private Book replacementBook;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    @Column(name = "replaced_by_admin")
    private String replacedByAdmin;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "replacement_date", nullable = false)
    private LocalDateTime replacementDate;

    @PrePersist
    protected void onCreate() {
        if (replacementDate == null) {
            replacementDate = LocalDateTime.now();
        }
    }
}
