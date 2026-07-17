package com.example.library.entity;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lost_books")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LostBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "book_id")
    private Long bookId;

    @Column(name = "borrow_request_id")
    private Long borrowRequestId;

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "accession_number", nullable = false)
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

    @Column(name = "branch")
    private String branch;

    @Column(name = "category")
    private String category;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "student_email")
    private String studentEmail;

    @Column(name = "student_branch")
    private String studentBranch;

    @Column(name = "student_year")
    private String studentYear;

    @Column(name = "borrow_date")
    private LocalDateTime borrowDate;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "reason")
    private String reason;

    @Column(name = "remarks")
    private String remarks;

    @Column(name = "reported_at", nullable = false)
    private LocalDateTime reportedAt;

    @Column(name = "reported_by_admin")
    private String reportedByAdmin;

    @PrePersist
    protected void onCreate() {
        if (reportedAt == null) {
            reportedAt = LocalDateTime.now();
        }
    }
}
