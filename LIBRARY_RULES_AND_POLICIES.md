# College Library - Rules and Policies

This document serves as a reference for all the business logic, rules, and constraints currently implemented in the library system.

## 1. Borrowing Rules
- **Maximum Borrow Limit:** A student can have a maximum of **2** active or pending borrow requests simultaneously.
- **No Duplicate Books:** A student cannot borrow multiple copies of the exact same book (ISBN) at the same time.
- **Admin Approval Required:** Borrow requests are made at the title-level (ISBN). They must be approved by a Library Admin who assigns a specific physical copy (Accession Number) to the student.
- **Fine Restriction:** Students are **blocked** from requesting new books if they have any outstanding (unpaid) fines.
- **Extensions:** Only Admins can extend a book loan (up to a maximum of **2** times). Students are not permitted to extend book loans themselves from their dashboard.

## 2. Reservation Rules
- **Maximum Reservation Limit:** A student can have a maximum of **2** pending reservations at any time.
- **No Duplicate Reservations:** A student cannot place multiple pending reservations for the exact same book (ISBN).
- **Auto-Conversion:** If a student requests to borrow a book that currently has no available copies (and they haven't reached their reservation limit), the system automatically converts their borrow request into a Reservation.

## 3. Fines & Penalties
- **Late Returns:** Returning a book past its due date incurs a penalty of **₹5.00 per day**.
- **Lost Books:** If a book is marked as lost, the total fine calculated will be the accumulated late fees (if any) **plus** the actual price of the book.
- **Fine Management:** Outstanding fines prevent students from borrowing more books. Fines can only be marked as `PAID` or `WAIVED` by an Admin.

## 4. Data Validation Rules
- **ISBN Format:** All ISBNs entered into the system (for adding books, borrowing, or reserving) are strictly validated. They must be exactly **10 or 13 digits** long. Hyphens and spaces are automatically removed and ignored during validation.
