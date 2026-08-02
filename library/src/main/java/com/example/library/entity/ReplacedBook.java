package com.example.library.entity;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "replaced_books")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplacedBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "original_book_id", nullable = false)
    private Long originalBookId;

    @Column(name = "replacement_book_id", nullable = false)
    private Long replacementBookId;

    @Column(name = "original_accession_number", nullable = false)
    private String originalAccessionNumber;

    @Column(name = "replacement_accession_number", nullable = false)
    private String replacementAccessionNumber;

    @Column(name = "replacement_date", nullable = false)
    private LocalDateTime replacementDate;

    @Column(name = "replaced_by")
    private String replacedBy;

    @PrePersist
    protected void onCreate() {
        if (replacementDate == null) {
            replacementDate = LocalDateTime.now();
        }
    }
}
