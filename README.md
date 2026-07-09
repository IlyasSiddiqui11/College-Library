# 📚 College-Library – Smart Library Management System

<p align="center">
  <b>A modern Smart Library Management System with QR-based attendance, ISBN barcode scanning, digital borrowing, and automated email notifications.</b>
</p>

<p align="center">

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react\&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3-6DB33F?logo=springboot\&logoColor=white)
![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk\&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql\&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?logo=tailwindcss\&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-success)

</p>

---

# 🚀 Overview

**College-Library** is a **full-stack Smart Library Management System** designed to digitize and automate the complete workflow of a college library. It replaces traditional paper-based processes with a modern web application that enables students and librarians to manage books, borrowing, attendance, and notifications efficiently.

The system combines **QR-based library entry**, **ISBN barcode scanning**, **digital borrow requests**, **approval workflows**, **return reminders**, and **gate log analytics** into a single platform. Students enjoy a seamless borrowing experience while librarians gain complete control over inventory and library operations.

---

# ✨ Key Features

## 👨‍🎓 Student Features

* Student Registration & Login
* Secure Authentication
* Profile Management
* QR Code Library Entry
* QR Exit Logging
* Search Books
* View Book Availability
* ISBN Barcode Book Search
* Borrow Request Submission
* View Borrow Status
* Borrow History
* Automated Return Reminder Emails
* Return Book Request

---

## 👨‍💼 Admin Features

* Admin Dashboard
* Student Management
* Book Management (CRUD)
* ISBN Barcode Scanner Integration
* Approve/Reject Borrow Requests
* Return Approval
* Inventory Tracking
* QR Attendance Monitoring
* Entry/Exit Gate Logs
* Email Notifications
* Borrow Analytics
* Library Statistics
* Due Date Monitoring

---

# 🏗️ Architecture

```text
                   +--------------------+
                   |   React Frontend   |
                   | (Vite + Tailwind)  |
                   +---------+----------+
                             |
                        REST API
                             |
                             ▼
                 +----------------------+
                 | Spring Boot Backend  |
                 | Business Logic       |
                 | Authentication       |
                 | Email Service        |
                 +----------+-----------+
                            |
                     Spring Data JPA
                            |
                            ▼
                  +-------------------+
                  |   MySQL Database  |
                  +-------------------+
```

### Frontend

* React 18
* Tailwind CSS
* QR Scanner
* Barcode Scanner
* Axios API Client

### Backend

* Spring Boot REST APIs
* Authentication
* Business Logic
* Email Notifications
* Inventory Management

### Database

Stores

* Students
* Books
* Borrow Requests
* Gate Logs
* Attendance Records
* User Accounts

---

# 🛠 Tech Stack

## Frontend

| Technology   | Purpose        |
| ------------ | -------------- |
| React 18     | UI Development |
| Vite         | Build Tool     |
| Tailwind CSS | Styling        |
| Axios        | REST API Calls |
| html5-qrcode | QR Scanner     |
| React Router | Routing        |

---

## Backend

| Technology      | Purpose                        |
| --------------- | ------------------------------ |
| Java 17         | Programming Language           |
| Spring Boot 3   | Backend Framework              |
| Spring Data JPA | Database Layer                 |
| Hibernate       | ORM                            |
| Spring Security | Authentication & Authorization |
| Lombok          | Boilerplate Reduction          |
| RestTemplate    | HTTP Client                    |
| Brevo Email API | Email Notifications            |
| Maven           | Build Tool                     |

---

# ⚙️ Setup & Installation

## 📌 Prerequisites

Install the following before starting:

* **JDK 17**
* **Maven**
* **Node.js ≥ 20**
* **npm**
* **MySQL** or **PostgreSQL**

---

## 📥 Clone Repository

```bash
git clone https://github.com/IlyasSiddiqui11/College-Library.git

cd College-Library
```

---

## ☕ Backend Setup

```bash
cd library
```

Copy

```text
.env.example
```

to

```text
.env
```

Run

```bash
mvn spring-boot:run
```

---

## ⚛️ Frontend Setup

```bash
cd lib_frontend

npm install

npm run dev
```

---

## 🗄 Database

Create a **MySQL** (or PostgreSQL) database.

Configure the database credentials inside the `.env` file.

Spring Data JPA will automatically create the required tables on first startup.

---

# 🔐 Environment Variables

Create:

```text
library/.env
```

Example:

```env
DATABASE_URL=jdbc:mysql://localhost:3306/college_library
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
BREVO_API_KEY=your_brevo_api_key
MAIL_FROM=noreply@yourdomain.com
```

### Variable Description

| Variable            | Purpose                              |
| ------------------- | ------------------------------------ |
| `DATABASE_URL`      | JDBC connection URL                  |
| `DATABASE_USERNAME` | Database username                    |
| `DATABASE_PASSWORD` | Database password                    |
| `BREVO_API_KEY`     | Brevo API key used for email sending |
| `MAIL_FROM`         | Sender email address                 |

---

# 📧 Email Service Configuration

The project includes an **EmailService** responsible for sending automated emails such as:

* Borrow Approval
* Return Reminder
* Borrow Notifications

The service uses the **Brevo SMTP API** through Spring Boot.

Required properties:

* `BREVO_API_KEY`
* `MAIL_FROM`

> **Important**

If your application is deployed on a cloud platform, ensure that **Brevo's "Block unknown IPs" setting is disabled**, or **whitelist the server's public IP address**. Otherwise, email requests may be rejected.

---

# ✅ Running Tests

Run backend tests using Maven:

```bash
mvn test
```

---

# 📚 API Documentation

## Authentication

| Method | Endpoint             |
| ------ | -------------------- |
| POST   | `/api/auth/register` |
| POST   | `/api/auth/login`    |

---

## Profile

| Method | Endpoint       |
| ------ | -------------- |
| GET    | `/api/profile` |
| PUT    | `/api/profile` |

---

## Books

| Method | Endpoint          |
| ------ | ----------------- |
| GET    | `/api/books`      |
| GET    | `/api/books/{id}` |
| POST   | `/api/books`      |
| PUT    | `/api/books/{id}` |
| DELETE | `/api/books/{id}` |

---

## Borrow Requests

| Method | Endpoint                   |
| ------ | -------------------------- |
| POST   | `/api/borrow`              |
| GET    | `/api/borrow`              |
| PUT    | `/api/borrow/{id}/approve` |
| PUT    | `/api/borrow/{id}/return`  |

---

## Gate Logs

| Method | Endpoint              |
| ------ | --------------------- |
| POST   | `/api/gatelogs/entry` |
| POST   | `/api/gatelogs/exit`  |
| GET    | `/api/gatelogs`       |

---

### Example cURL

```bash
curl -X POST http://localhost:8080/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email":"student@example.com",
  "password":"password123"
}'
```

---

# 🚀 Future Enhancements

* JWT Authentication
* Fine Management
* Reservation System
* RFID Integration
* Analytics Dashboard
* Multi-Library Support
* Mobile Application
* Digital Library Integration
* Book Recommendation System
* AI-powered Search

---

# 🤝 Contributing

Contributions are always welcome!

1. Fork the repository.
2. Create a feature branch.
3. Follow **Spring Boot** coding conventions.
4. Use **Lombok** where appropriate to reduce boilerplate.
5. Write clean and well-documented code.
6. Commit with meaningful messages.
7. Open a Pull Request.

---

# 📄 License

This project is licensed under the **MIT License**.

---

# 🙏 Acknowledgements

Special thanks to:

* **Brevo** for email delivery services.
* **Spring Boot** community.
* **React** ecosystem.
* **Tailwind CSS**
* **html5-qrcode**
* **Axios**
* **Hibernate**
* **Spring Security**

### Contributors

* **Mohammed Ilyas Siddiqui**
* **Prince**

---

# ⭐ Give a Star

If you found this project useful, please consider giving it a **⭐ Star** on GitHub!

It helps support the project and motivates future development.

**⭐ Give a ⭐ if you like it!**
