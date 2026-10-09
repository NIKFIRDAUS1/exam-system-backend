# Exam Scheduling and Result Management System

## 1. Project Overview

This project is a web-based Exam Scheduling and Result Management System developed using PHP, MySQL, HTML, CSS, and JavaScript. It provides examination management functions for administrators, lecturers, and students through a RESTful API.

## 2. Main Features

- User login with JWT authentication
- Role-based access control
- User, course, examination, and venue management
- Student registration management
- Examination result management and automatic grade calculation
- Notifications
- Search and pagination
- QR code generation for student result slips

## 3. Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: PHP
- Database: MySQL
- Local development environment: XAMPP
- Authentication: JSON Web Token (JWT)
- PHP dependency management: Composer
- API testing: Postman
- Third-party integration: QR code generation API

## 4. Installation and Setup

1. Install XAMPP and start Apache and MySQL.
2. Copy the project folder into `C:\xampp\htdocs\`.
3. Open phpMyAdmin at `http://localhost/phpmyadmin`.
4. Create or import the database using `exam_management_system.sql`.
5. Check the database connection settings in `config/database.php`.
6. Ensure the Composer dependencies are installed.
7. Open the login page using the URL below.

## 5. Access URLs

**Frontend login page:**

`http://localhost/exam-system/frontend/login.html`
`http://localhost/exam-system/frontend-rafie/index.html`

**API base URL:**

`http://localhost/exam-system/api/`

**Example login endpoint:**

`http://localhost/exam-system/api/login.php`

## 6. Demonstration Login Accounts

The system supports three user roles.

| Role | Email | Password |
|---|---|---|
| Administrator | [admin@exam.com] | [password123] |
| Lecturer | [siti@exam.com] | [password123] |
| Student | [ali@student.com] | [password123] |

Use the demonstration accounts configured in the imported database. Passwords must match the hashes stored in the database.

## 7. API Authentication

Protected API endpoints require a valid JWT token. After logging in, include the token in the request's Authorization header:

`Authorization: Bearer YOUR_JWT_TOKEN`

Access to API operations depends on the user's role.

## 8. Repository Contents

- `api/` — REST API endpoints
- `config/` — Database and JWT configuration
- `middleware/` — Authentication, role control, validation, and error handling
- `frontend/` — NIK MUHAMMAD FIRDAUS frontend
- `frontend-rafie/` — Ahmad Rafie Frontend
- `exam_management_system.sql` — Database structure and sample data
- `composer.json` and `composer.lock` — PHP dependency information

## 9. Notes

This project is intended for academic demonstration and local development. Apache and MySQL must be running for the local application to work. The demonstration accounts should be verified before use.