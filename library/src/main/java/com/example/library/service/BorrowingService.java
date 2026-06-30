package com.example.library.service;
// FOR EMAIL SENDING 
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class BorrowingService {

    private final EmailService emailService; 

    // Existing Approval Method
    public void processBookApproval(String studentEmail, String studentName, String bookTitle, 
                                    String author, String isbn, LocalDate issueDate, LocalDate dueDate) {
        String subject = "Book Borrowing Request Approved";
        String body = """
            Dear %s,
            
            We are pleased to inform you that your request to borrow the following book has been approved.
            
            Book Details:
            ----------------------------------------
            Title      : %s
            Author     : %s
            ISBN       : %s
            Issue Date : %s
            Due Date   : %s
            ----------------------------------------
            
            Please collect your book from the library at your earliest convenience. Kindly ensure that the book is returned on or before the due date to avoid any overdue penalties.
            
            If you have already collected the book, please disregard the collection reminder.
            
            Thank you for using the College Library Management System.
            
            Best Regards,
            College Library
            Library Management System
            """.formatted(studentName, bookTitle, author, isbn, issueDate, dueDate);

        emailService.sendEmail(studentEmail, subject, body);
    }

    // NEW: Return Confirmation Method
    public void processBookReturn(String studentEmail, String studentName, String bookTitle, 
            String author, String isbn, LocalDate returnDate) {
        
        String subject = "Book Return Confirmation";
        
        // Formatted template for book returns
        String body = """
            Dear %s,
            
            This is to confirm that the following book has been successfully returned to the College Library.
            
            Book Details:
            ----------------------------------------
            Title       : %s
            Author      : %s
            ISBN        : %s
            Return Date : %s
            ----------------------------------------
            
            Thank you for returning the book on time.
            
            We appreciate your cooperation in helping us maintain the library collection for all students. We hope you continue to make use of our library services for your academic needs.
            
            If you have any questions or believe this confirmation was sent in error, please contact the library staff.
            
            Thank you for using the College Library Management System.
            
            Best Regards,
            College Library
            Library Management System
            """.formatted(studentName, bookTitle, author, isbn, returnDate);

        // Reusing your clean EmailService
        emailService.sendEmail(studentEmail, subject, body);
    }
}
