# College Library - Rules and Policies

This document serves as a reference for all the business logic, rules, and constraints currently implemented in the library system.

## 1. Borrowing Rules
- **Maximum Borrow Limit:** A student can have a maximum of **2** active or pending borrow requests simultaneously.
- **No Duplicate Books:** A student cannot borrow multiple copies of the exact same book (ISBN) at the same time.
- **Admin Approval Required:** Borrow requests are made at the title-level (ISBN). They must be approved by a Library Admin who assigns a specific physical copy (Accession Number) to the student.
- **Fine Restriction:** Students are **blocked** from requesting new books or placing reservations if they have any outstanding (unpaid/pending) fines.
- **Extensions:** Only Admins can extend a book loan (up to a maximum of **2** times). Students are not permitted to extend book loans themselves from their dashboard.

## 2. Reservation Rules
- **Maximum Reservation Limit:** A student can have a maximum of **2** pending reservations at any time.
- **No Duplicate Reservations:** A student cannot place multiple pending reservations for the exact same book (ISBN).
- **Auto-Conversion:** If a student requests to borrow a book that currently has no available copies (and they haven't reached their reservation limit), the system automatically converts their borrow request into a Reservation.
- **No Reservations for Lost Books:** If all copies of a book are marked as `LOST`, the system will block any new reservations from being placed for that book.

## 3. Fines & Penalties
- **Late Returns:** Returning a book past its due date incurs a penalty of **₹5.00 per day**.
- **Lost Books:** If a book is marked as lost, the total fine calculated will be the accumulated late fees (if any) **plus** the actual price of the book.
  - *Note:* If a specific book copy is reported lost (and not replaced), any pending reservations assigned to that specific copy are automatically cancelled.
- **Book Replacement:** When an Admin replaces a lost or damaged book with a new copy, the original is marked as lost **without generating a fine**, and any pending reservations on the old copy are seamlessly transferred to the new replacement copy.
- **Fine Management:** Outstanding fines prevent students from borrowing or reserving books. Fines can only be marked as `PAID` or `WAIVED` by an Admin.

## 4. Data Validation Rules
- **ISBN Format:** All ISBNs entered into the system (for adding books, borrowing, or reserving) are strictly validated. They must be exactly **10 or 13 digits** long. Hyphens and spaces are automatically removed and ignored during validation.
