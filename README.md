# 📚 College-Library – Smart Library Management System

<p align="center">
  <b>A modern, enterprise-grade Smart Library Management System with QR-based attendance, ISBN barcode scanning, digital borrowing workflows, real-time analytics, and automated email notifications.</b>
</p>

<p align="center">

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react\&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3-6DB33F?logo=springboot\&logoColor=white)
![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk\&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql\&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?logo=vite\&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-success)

</p>

---

## 🚀 Overview

**College-Library** is a **full-stack Smart Library Management System** built to digitize and automate every workflow of a college library. It replaces traditional paper-based processes with a modern, responsive web application enabling students and librarians to manage books, borrowing, gate attendance, fines, and notifications from a single platform.

The system features **QR-based library entry/exit tracking**, **ISBN barcode scanning**, **digital borrow requests with approval workflows**, **lost book tracking**, **automated fine management**, **book reservation queues**, and a live **real-time admin dashboard** — all wrapped in a light-theme glassmorphism UI.

----

## ✨ Feature Highlights

### 👨‍🎓 Student Portal

| Feature | Description |
|---|---|
| Registration & Login | Secure auth with session management |
| QR Code Entry/Exit | Scan personal QR to log library access |
| Book Search | Search catalog by title, author, or ISBN |
| Barcode Scanner | Scan ISBN barcodes to look up books |
| Borrow Requests | Submit, track, and manage borrow requests |
| Book Reservations | Reserve books that are currently borrowed |
| Return Management | Initiate return requests through the portal |
| Fine Tracking | View outstanding fines and payment status |
| Profile Management | Update personal details and view history |
| Automated Emails | Receive approval, reminder, and due-date alerts |

### 👨‍💼 Admin Portal

| Feature | Description |
|---|---|
| Live Dashboard | Real-time today's entries, exits, borrows, and counts |
| Inventory Management | Full CRUD with accession numbers, source & classification |
| Borrow Approval | Approve/reject requests and assign physical copy accession numbers |
| Return Station | Process book returns and mark as returned |
| Lost Book Tracking | Mark books as LOST, auto-generate fines; book stays in catalog with LOST badge |
| Fine Management | View, manage, and resolve student fines |
| Book Reservations | Manage reservation queues, auto-fulfill on book return/add |
| Gate Logs | Monthly filtered view with summary cards (entries, exits, inside count, avg. daily) |
| Student Management | View all registered students and their activity |
| Email Notifications | Automated emails for approvals, reminders, and due dates |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│           React 18 Frontend         │
│  Vite · Axios · React Router DOM    │
│  html5-qrcode · lucide-react        │
└──────────────┬──────────────────────┘
               │ REST API (HTTP/JSON)
               │ Port: 8081
               ▼
┌─────────────────────────────────────┐
│        Spring Boot 3 Backend        │
│  Controllers · Services · JPA Repos │
│  Spring Security · Email Service    │
└──────────────┬──────────────────────┘
               │ Spring Data JPA / Hibernate
               ▼
┌─────────────────────────────────────┐
│          PostgreSQL Database        │
│         (Neon / Local / Any)        │
└─────────────────────────────────────┘
```

### Database Entities

| Entity | Description |
|---|---|
| `User` | Student and Admin accounts |
| `StudentProfile` | Extended student details (branch, year, roll number) |
| `Book` | Physical book copies with accession numbers |
| `BorrowRequest` | Borrow lifecycle (PENDING → APPROVED → RETURNED) |
| `BookReservation` | Queue for unavailable books |
| `GateLog` | Entry/exit sessions tied to users |
| `LostBook` | Lost book records with fine linkage |
| `Fine` | Student fines with paid/unpaid status |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | UI Framework |
| Vite | Build Tool & Dev Server |
| Vanilla CSS (Glassmorphism) | Styling |
| Axios | REST API Client |
| React Router DOM | Client-side Routing |
| html5-qrcode | QR & Barcode Scanning |
| lucide-react | Icon Library |

### Backend

| Technology | Purpose |
|---|---|
| Java 17 | Programming Language |
| Spring Boot 3 | Backend Framework |
| Spring Data JPA | Data Access Layer |
| Hibernate | ORM (ddl-auto: update) |
| Spring Security | Authentication & Authorization |
| Lombok | Boilerplate Reduction |
| Brevo Email API | Transactional Email Notifications |
| Maven Wrapper | Build Tool |

### Database

| Technology | Purpose |
|---|---|
| PostgreSQL | Primary Database |
| Neon (optional) | Serverless PostgreSQL hosting |

---

## ⚙️ Setup & Installation

### 📌 Prerequisites

- **JDK 17+**
- **Node.js ≥ 20** and **npm**
- **PostgreSQL** (local or cloud like [Neon](https://neon.tech))

---

### 📥 Clone the Repository

```bash
git clone https://github.com/IlyasSiddiqui11/College-Library.git
cd College-Library
```

---

### 🔐 Configure Environment Variables

Create a `.env` file in the **project root** (`College-Library/.env`):

```env
DATABASE_URL=jdbc:postgresql://localhost:5432/college_library
DATABASE_USERNAME=your_db_username
DATABASE_PASSWORD=your_db_password
BREVO_API_KEY=your_brevo_api_key
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Full JDBC PostgreSQL connection URL |
| `DATABASE_USERNAME` | Database login username |
| `DATABASE_PASSWORD` | Database login password |
| `BREVO_API_KEY` | API key from [Brevo](https://brevo.com) for email delivery |

> **Note:** The backend reads this `.env` from the **parent directory** of `library/` automatically via the `dotenv` Spring configuration.

---

### ☕ Start the Backend

```bash
cd library
./mvnw spring-boot:run
```

The backend starts on **http://localhost:8081**.

> On Windows, use `.\mvnw.cmd spring-boot:run`

Hibernate's `ddl-auto=update` will automatically create/update all required database tables on first startup.

---

### ⚛️ Start the Frontend

```bash
cd lib_frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:5173** (or the next available port).

---

## 📧 Email Notifications

This system uses the **Brevo SMTP API** for automated emails. The following events trigger emails:

- ✅ Borrow request **approved**
- ⏰ **Due date reminder** (automated scheduler)
- 📚 **Return confirmation**
- 🔔 **Reservation fulfillment**

> **Important:** If deployed on a cloud platform, ensure Brevo's **"Block unknown IPs"** setting is disabled, or whitelist your server's public IP.

---

## 📚 API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new student |
| POST | `/api/auth/login` | Login and receive session token |
| POST | `/api/auth/logout` | Logout current session |

### Profile

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/profile` | Get current user profile |
| PUT | `/api/profile` | Update profile details |

### Books (Catalog & Inventory)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/books` | List all physical book copies (admin) |
| GET | `/api/books/catalog` | Grouped catalog by ISBN (student-facing) |
| GET | `/api/books/isbn/{isbn}` | Book details by ISBN |
| GET | `/api/books/isbn/{isbn}/available-copies` | Available physical copies for assignment |
| POST | `/api/books` | Add new book copies with accession numbers |
| PUT | `/api/books/{id}` | Update a book copy |
| DELETE | `/api/books/{id}` | Delete a book copy |

### Borrow Requests

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/borrow` | Submit a borrow request |
| GET | `/api/borrow` | List all borrow requests |
| GET | `/api/borrow/my` | Student's own borrow history |
| POST | `/api/admin/approve/{id}` | Approve a request with accession number |
| POST | `/api/admin/reject/{id}` | Reject a borrow request |
| POST | `/api/admin/return/{id}` | Process a book return |

### Gate Logs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/gate/entry` | Log a student's library entry |
| POST | `/api/gate/exit` | Log a student's library exit |
| GET | `/api/gate/logs` | All gate sessions (admin) |
| GET | `/api/gate/monthly?year=&month=` | Monthly filtered gate logs |
| GET | `/api/gate/monthly/stats?year=&month=` | Monthly gate statistics summary |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/today` | Today's live overview (entries, exits, borrows, inside count) |

### Lost Books

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/lost-books` | Report a book as lost (sets status=LOST, generates fine) |
| GET | `/api/lost-books` | List all lost book records |

### Fines

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/fines` | All fines (admin) |
| GET | `/api/fines/my` | Current user's fines |
| POST | `/api/fines/{id}/pay` | Mark fine as paid |

### Book Reservations

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/reservations` | Reserve a book by ISBN |
| GET | `/api/reservations` | List all reservations |
| DELETE | `/api/reservations/{id}` | Cancel a reservation |

---

## 🗂️ Project Structure

```
College-Library/
├── .env                        # Shared environment variables
├── library/                    # Spring Boot Backend
│   ├── src/main/java/com/example/library/
│   │   ├── controller/         # REST Controllers (Auth, Book, Borrow, Gate, Dashboard, Fine, LostBook, Reservation)
│   │   ├── service/            # Business Logic (BookService, BorrowService, GateLogService, DashboardService, FineService, etc.)
│   │   ├── entity/             # JPA Entities (User, Book, BorrowRequest, GateLog, LostBook, Fine, BookReservation)
│   │   ├── repository/         # Spring Data JPA Repositories
│   │   ├── dto/                # Request/Response DTOs
│   │   ├── enums/              # Enums (BorrowStatus, FineStatus, etc.)
│   │   ├── config/             # Security & App Configuration
│   │   └── exception/          # Custom Exception Handlers
│   └── src/main/resources/
│       └── application.properties
└── lib_frontend/               # React Frontend
    ├── src/
    │   ├── pages/              # Page Components (AdminDashboard, InventoryManagement, GateLogs, etc.)
    │   ├── components/         # Shared UI Components
    │   ├── context/            # Auth Context
    │   └── api/                # Axios Client Configuration
    └── public/
```

---

## 🔄 Key Workflows

### Book Borrowing
1. Student searches for a book and submits a borrow request.
2. Admin sees the request on the dashboard with a **PENDING** badge.
3. Admin selects an available physical copy (by accession number) and approves.
4. Student receives an approval email with the due date.
5. On the due date, an automated reminder email is sent.
6. Student returns the book; admin confirms at the Return Station.

### Lost Book Workflow
1. Admin navigates to **Lost Books** or clicks "Report Lost" on a BORROWED book in the catalog.
2. The system updates the book's status to **LOST** in the inventory (the record is preserved, not deleted).
3. A fine record is automatically generated and linked to the responsible student.
4. The book appears in the Admin Catalog with a red **LOST** badge and can be filtered separately.

### Gate Entry/Exit (QR)
1. Student opens their profile QR code.
2. Admin/Scanner scans the QR to log **entry** or **exit**.
3. All sessions are recorded in Gate Logs with timestamps.
4. Admins can filter gate logs by **month and year** and view live analytics (entries, exits, currently inside, average daily visitors).

---

## 🚀 Future Enhancements

- [ ] JWT-based stateless authentication
- [ ] RFID/NFC card integration for gate entry
- [ ] AI-powered book recommendation engine
- [ ] Multi-library / multi-branch support
- [ ] Mobile PWA application
- [ ] Digital eBook library integration
- [ ] Advanced analytics with charts (Chart.js / Recharts)
- [ ] Role-based fine waiver system
- [ ] Book condition tracking (worn, damaged, etc.)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Follow Spring Boot and React coding conventions.
4. Use Lombok to reduce boilerplate.
5. Commit with meaningful messages: `git commit -m "feat: add X feature"`
6. Open a Pull Request against the `main` branch.

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🙏 Acknowledgements

Special thanks to:

- **Brevo** — transactional email delivery
- **Neon** — serverless PostgreSQL hosting
- **Spring Boot** community
- **React** ecosystem
- **html5-qrcode** — QR & barcode scanning in the browser
- **lucide-react** — beautiful icon set
- **Hibernate** — ORM framework

### ✍️ Authors

- **Mohammed Ilyas Siddiqui**
- **Prince**

---

<p align="center">
  ⭐ If you found this project useful, please give it a star on GitHub! It helps support the project. ⭐
</p>
