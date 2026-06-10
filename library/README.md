# Smart Library Management System Backend

This repository contains the complete production-style Java Spring Boot 3 backend for a decentralized Smart Library Management System.

## Technologies Used
- **Backend Framework**: Spring Boot 3.2.5
- **Language**: Java 17
- **Database**: MySQL
- **ORM**: Hibernate & Spring Data JPA
- **Security**: Spring Security (Permit All for testing, BCrypt for password hashing)
- **Dependency Management**: Maven

---

## 1. Database Schema Design

The system maps 5 relational entities in MySQL:

### 1. `users`
Tracks both student and administrator accounts.
- `id` (BIGINT, Primary Key, Auto Increment)
- `name` (VARCHAR, Not Null)
- `email` (VARCHAR, Unique, Not Null)
- `password` (VARCHAR, BCrypt hashed, Not Null)
- `role` (VARCHAR, STUDENT or ADMIN, Not Null)
- `created_at` (TIMESTAMP, Not Null)
- `updated_at` (TIMESTAMP)

### 2. `student_profiles`
Maintains extended student details. Connected via a 1:1 relation to the `users` table.
- `id` (BIGINT, Primary Key, Auto Increment)
- `user_id` (BIGINT, Unique Foreign Key references `users.id`, Not Null)
- `branch` (VARCHAR, Not Null)
- `year` (INT, Not Null)
- `contact_number` (VARCHAR, Not Null)
- `address` (VARCHAR, Not Null)
- `profile_completed` (BOOLEAN, Default True)
- `created_at` (TIMESTAMP, Not Null)
- `updated_at` (TIMESTAMP)

### 3. `books`
Maintains the book inventory.
- `id` (BIGINT, Primary Key, Auto Increment)
- `isbn` (VARCHAR, Unique, Not Null)
- `title` (VARCHAR, Not Null)
- `author` (VARCHAR, Not Null)
- `total_copies` (INT, Not Null)
- `available_copies` (INT, Not Null)
- `created_at` (TIMESTAMP, Not Null)
- `updated_at` (TIMESTAMP)

### 4. `borrow_requests`
Manages the book borrowing lifecycle request. Mapped with many-to-one to `users` and `books`.
- `id` (BIGINT, Primary Key, Auto Increment)
- `user_id` (BIGINT, Foreign Key references `users.id`, Not Null)
- `book_id` (BIGINT, Foreign Key references `books.id`, Not Null)
- `status` (VARCHAR, PENDING, APPROVED, RETURNED, REJECTED, Not Null)
- `request_date` (TIMESTAMP, Not Null)
- `approved_date` (TIMESTAMP)
- `returned_date` (TIMESTAMP)
- `created_at` (TIMESTAMP, Not Null)
- `updated_at` (TIMESTAMP)

### 5. `gate_logs`
Logs entry and exit times at the library physical gate using QR codes.
- `id` (BIGINT, Primary Key, Auto Increment)
- `user_id` (BIGINT, Foreign Key references `users.id`, Not Null)
- `entry_time` (TIMESTAMP, Not Null)
- `exit_time` (TIMESTAMP)
- `created_at` (TIMESTAMP, Not Null)

---

## 2. API Endpoints & Sample Postman Requests

All APIs reside under the `/api` prefix.

### Phase 1: Authentication

#### A. Register Student or Admin
- **Method**: `POST`
- **URL**: `http://localhost:8080/api/auth/register`
- **Body (JSON)**:
```json
{
  "name": "John Doe",
  "email": "johndoe@university.edu",
  "password": "securepassword123",
  "role": "STUDENT"
}
```
*(Use role `"ADMIN"` to create an administrator account)*

#### B. Login
- **Method**: `POST`
- **URL**: `http://localhost:8080/api/auth/login`
- **Body (JSON)**:
```json
{
  "email": "johndoe@university.edu",
  "password": "securepassword123"
}
```

---

### Phase 2: Student Profile Completion

#### A. Complete Profile
- **Method**: `POST`
- **URL**: `http://localhost:8080/api/profile/complete`
- **Body (JSON)**:
```json
{
  "userId": 1,
  "branch": "Computer Science & Engineering",
  "year": 3,
  "contactNumber": "+1234567890",
  "address": "123 University Dorms, Campus Road"
}
```

#### B. Get Profile Details
- **Method**: `GET`
- **URL**: `http://localhost:8080/api/profile/1`

---

### Phase 3: Book Catalog Management

#### A. Add Book (Admin Workflow)
- **Method**: `POST`
- **URL**: `http://localhost:8080/api/books`
- **Body (JSON)**:
```json
{
  "isbn": "978-0134685991",
  "title": "Effective Java (3rd Edition)",
  "author": "Joshua Bloch",
  "totalCopies": 5
}
```

#### B. Get All Books
- **Method**: `GET`
- **URL**: `http://localhost:8080/api/books`

#### C. Search Book by ISBN
- **Method**: `GET`
- **URL**: `http://localhost:8080/api/books/isbn/978-0134685991`

#### D. Update Book Inventory
- **Method**: `PUT`
- **URL**: `http://localhost:8080/api/books/1/inventory?totalCopies=8`

---

### Phase 4: Borrow Request Lifecycle

#### A. Student Submits Borrow Request (using barcode/ISBN scan)
- **Method**: `POST`
- **URL**: `http://localhost:8080/api/borrow/request`
- **Body (JSON)**:
```json
{
  "userId": 1,
  "isbn": "978-0134685991"
}
```

#### B. Admin Approves Request
- **Method**: `POST`
- **URL**: `http://localhost:8080/api/admin/approve/1`

#### C. Admin Rejects Request
- **Method**: `POST`
- **URL**: `http://localhost:8080/api/admin/reject/1`

#### D. Return Book (Quick Return scan)
- **Method**: `POST`
- **URL**: `http://localhost:8080/api/borrow/return?userId=1&isbn=978-0134685991`

---

### Phase 5: Gate Attendance QR Simulation

#### A. Scan Gate QR (Simulates Entry/Exit)
*Scanning the user ID checks the student in (registers `entry_time`). Scanning the same user ID again when they leave checks them out (registers `exit_time`).*
- **Method**: `POST`
- **URL**: `http://localhost:8080/api/gate/scan`
- **Body (JSON)**:
```json
{
  "userId": 1
}
```

#### B. Get All Attendance Logs
- **Method**: `GET`
- **URL**: `http://localhost:8080/api/gate/logs`

#### C. Get Attendance Logs for Specific User
- **Method**: `GET`
- **URL**: `http://localhost:8080/api/gate/user/1`
