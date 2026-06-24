# 📚 Smart Library Management System

<div align="center">

### 🚀 Modern Full-Stack Library Automation Platform

Streamlining college library operations through **QR-based attendance**, **ISBN barcode scanning**, **real-time inventory tracking**, and **digital borrowing workflows**.

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3-green?logo=springboot)
![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
![MySQL](https://img.shields.io/badge/MySQL-Database-blue?logo=mysql)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Frontend-38BDF8?logo=tailwindcss)
![Contributors](https://img.shields.io/badge/Contributors-2-blue)
![Status](https://img.shields.io/badge/Status-Completed-success)

</div>

---

## ✨ Project Overview

Traditional library systems often rely on manual processes for attendance, borrowing, and inventory tracking.

This project introduces a **Smart Library Management System** that digitizes the entire workflow using modern web technologies and automation.

Students can enter the library using QR-based attendance, scan book ISBN barcodes directly from their phones, and request books without standing in queues. Librarians manage inventory, approve requests, monitor attendance logs, and process returns through a centralized dashboard.

---

## 🎯 Key Features

### 👨‍🎓 Student Module

✅ Registration & Login

✅ Profile Completion

✅ QR-Based Library Entry

✅ Library Exit Tracking

✅ ISBN Barcode Scanning

✅ Borrow Request Submission

✅ Borrow History Tracking

✅ Real-Time Library Status

✅ Mobile Responsive Dashboard

---

### 👨‍💼 Admin Module

✅ Admin Dashboard

✅ Book Inventory Management

✅ Borrow Request Approval/Rejection

✅ Return Station Management

✅ Student Activity Monitoring

✅ Attendance Monitoring

✅ Gate Log Analytics

✅ Real-Time Inventory Updates

---

## 🔄 System Workflow

### 📍 Library Entry

```text
Student
   ↓
Scan QR Code
   ↓
Attendance Recorded
   ↓
Status Updated to INSIDE
```

---

### 📖 Book Borrowing

```text
Scan ISBN Barcode
        ↓
Borrow Request Created
        ↓
Admin Reviews Request
        ↓
Approved / Rejected
        ↓
Inventory Updated
```

---

### 🔁 Book Return

```text
Return Station
      ↓
Student ID + ISBN
      ↓
Return Processed
      ↓
Inventory Increased
```

---

### 🚪 Library Exit

```text
Student Clicks Exit Library
           ↓
Exit Time Recorded
           ↓
Status Updated to OUTSIDE
```

---

## 🏗️ System Architecture

```text
┌─────────────────────┐
│   React Frontend    │
│  (Vite + Tailwind)  │
└─────────┬───────────┘
          │ REST APIs
          ▼
┌─────────────────────┐
│ Spring Boot Backend │
│      (Java 17)      │
└─────────┬───────────┘
          │ JPA/Hibernate
          ▼
┌─────────────────────┐
│   MySQL Database    │
└─────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

* React 18
* Vite
* JavaScript
* Tailwind CSS
* React Router DOM
* Axios
* html5-qrcode

### Backend

* Spring Boot
* Spring Data JPA
* Hibernate ORM
* REST APIs
* BCrypt Password Encryption

### Database

* MySQL

### Deployment

* Vercel
* Render
* Railway MySQL

---

## 🗄️ Database Modules

### 👤 User

* ID
* Name
* Email
* Password
* Role

### 🎓 Student Profile

* Branch
* Year
* Phone Number
* Address

### 📚 Books

* ISBN
* Title
* Author
* Total Copies
* Available Copies

### 📋 Borrow Requests

* Student
* Book
* Status
* Borrow Date
* Return Date

### 🚪 Gate Logs

* Entry Time
* Exit Time
* Status
* Student Details

---

## 📡 API Modules

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Profile

```http
POST /api/profile/complete
GET /api/profile/{userId}
```

### Books

```http
GET /api/books
GET /api/books/isbn/{isbn}
POST /api/books
```

### Borrow Requests

```http
POST /api/borrow/request
PUT /api/admin/approve/{id}
PUT /api/admin/reject/{id}
PUT /api/admin/return/{id}
```

### Gate Logs

```http
POST /api/gate/scan
POST /api/gate/exit/{userId}
GET /api/gate/logs
```

---

## 🌟 Highlights

🚀 Full-Stack Web Application

📱 Mobile-Responsive Design

📚 ISBN Barcode Scanning

📍 QR-Based Attendance

⚡ Real-Time Inventory Updates

🔄 Transaction-Safe Borrow Workflow

🏗️ Clean Layered Architecture

🎯 Industry-Relevant Tech Stack

💼 Portfolio & Internship Ready

---

## ⚙️ Local Setup

### Clone Repository

```bash
git clone https://github.com/IlyasSiddiqui11/College-Library.git
```

### Backend

```bash
cd backend
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔮 Future Enhancements

* JWT Authentication
* Email Notifications
* Fine Management System
* Book Reservation System
* Advanced Analytics Dashboard
* RFID Integration
* Report Generation
* Multi-Library Support

---

## 👨‍💻 Contributors

This project was collaboratively developed by:

### Mohammed Ilyas Israr Ahmed Siddiqui

**BE Computer Science & Engineering (Data Science)**

Passionate about Full-Stack Development, Spring Boot, React, and building real-world software solutions.

**GitHub:** https://github.com/IlyasSiddiqui11

---

### Prince Yadav

Passionate about software development and building practical applications using modern technologies.

**GitHub:** https://github.com/prince902226062-code

---

## 🤝 Collaboration

The Smart Library Management System was designed and developed as a collaborative project with the goal of modernizing traditional library workflows. The project combines QR-based attendance tracking, ISBN barcode scanning, real-time inventory management, and digital borrowing processes to create a seamless library experience for both students and administrators.

Both contributors worked together on system design, implementation, testing, and deployment, applying industry-standard software development practices and modern full-stack technologies.

---

### ⭐ If you like this project, consider giving it a star!
