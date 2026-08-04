# Mail Configuration / Templates

This file can be used to store email templates, configuration details, or logs for the library management system's mailing service.

## Email Triggers

The system automatically sends emails to users under the following circumstances:

1. **Authentication, Security & Account Management**
   - **Registration OTP:** Sent when a user first registers an account to verify their email address.
   - **Resend OTP:** Sent if the user requests a new verification OTP.
   - **Password Reset:** Sent when a user clicks "Forgot Password" to provide a secure reset link.
   - **Profile Completion Confirmation:** Sent when a user successfully completes or updates their profile details.

2. **Borrowing & Returns**
   - **Borrow Request Approved:** Sent when the librarian approves a user's book borrow request.
   - **Book Return Confirmation:** Sent when a user successfully returns a borrowed book to the library.
   - **Return Reminder:** A scheduled daily reminder sent at 8:00 AM to students whose books are due for return the following day.

3. **Reservations**
   - **Reservation Confirmed:** Sent when a user successfully places a reservation for a book that is currently unavailable.
   - **Reserved Book Available:** Sent to notify the user that their reserved book is now available and an automatic borrow request has been generated for them.

4. **Fines & Penalties**
   - **Fine Assigned (Late Return):** Sent when a fine is generated due to returning a book past its due date.
   - **Fine Assigned (Lost Book):** Sent when a fine is applied because a book was reported lost.
   - **Fine Payment Confirmation:** Sent when the admin verifies that a user has successfully paid their outstanding fine.

---

## Templates

### 1. Book Borrowing Request Approved
**Subject:** Book Borrowing Request Approved
**Body:**
```text
Dear [Student Name],

We are pleased to inform you that your request to borrow the following book has been approved.

Book Details:
----------------------------------------
Title      : [Book Title]
Author     : [Author]
ISBN       : [ISBN]
Issue Date : [Issue Date]
Due Date   : [Due Date]
----------------------------------------

Please collect your book from the library at your earliest convenience. Kindly ensure that the book is returned on or before the due date to avoid any overdue penalties.
```

### 2. Book Return Confirmation
**Subject:** Book Return Confirmation
**Body:**
```text
Dear [Student Name],

This is to confirm that the following book has been successfully returned to the College Library.

Book Details:
----------------------------------------
Title       : [Book Title]
Author      : [Author]
ISBN        : [ISBN]
Return Date : [Return Date]
----------------------------------------

Thank you for returning the book on time.
```
