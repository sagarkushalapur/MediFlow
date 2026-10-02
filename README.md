# MediFlow — Secure QR-Based Patient Medical History System

> A full-stack healthcare record management prototype that uses QR-based patient identification, JWT authentication, role-based access control, and append-only medical history to provide fast access to patient information for authorized workflows.

[![Java](https://img.shields.io/badge/Java-17+-ED8B00?logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.3-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Maven](https://img.shields.io/badge/Build-Maven-C71A36?logo=apachemaven&logoColor=white)](https://maven.apache.org/)
[![Frontend](https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JavaScript-F7DF1E?logo=javascript&logoColor=111)](https://developer.mozilla.org/)

## Overview

MediFlow is a QR-enabled patient medical history system designed to simplify access to essential medical information during clinical workflows.

A patient receives a unique QR token. A doctor can use that token to identify the patient and retrieve available profile information and medical history. New consultations are recorded as separate historical entries rather than modifying previous records.

The repository contains:

- A **Spring Boot REST API** for authentication, patient data, doctor workflows, QR token resolution, medical history, prescriptions, and medicines.
- A **MySQL** persistence layer with relational entities and seed/demo data.
- A **responsive static frontend** in `frontend/` built with HTML, CSS, and vanilla JavaScript.
- A small **Vite/React scaffold** at the repository root. The documented application flow currently uses the static frontend in `frontend/`.

> **Important:** This repository is a prototype/demo project. It should not be used with real patient information or deployed as a production healthcare system without additional security, privacy, compliance, monitoring, infrastructure, and clinical-safety controls.

---

## Key Features

### Patient

- Patient registration and login
- Patient profile management/view
- Blood group and allergy information
- Medical history timeline
- Prescription and medicine history
- Unique QR token generation
- QR code retrieval as a PNG image

### Doctor

- Doctor registration and login
- Role-based access to doctor APIs
- Patient lookup by patient ID
- Patient lookup by QR token
- View patient medical history
- Add a new consultation with diagnosis, symptoms, notes, and medicines

### Medical Record Integrity

MediFlow follows an append-only workflow for consultations:

- Existing medical records are not exposed through update/delete endpoints.
- A new consultation creates a **new `medical_records` row**.
- Prescriptions and medicines are associated with the newly created record.
- Historical entries remain available for review.

### Security Foundations

- Spring Security 6
- JWT-based stateless authentication
- BCrypt password hashing
- Patient/doctor role separation
- Request validation using Jakarta Bean Validation
- Centralized exception handling
- QR tokens stored as unique patient identifiers

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3.2.3 |
| API | Spring Web / REST |
| Persistence | Spring Data JPA, Hibernate |
| Database | MySQL 8.0+ |
| Authentication | Spring Security, JWT (JJWT 0.11.5) |
| Password Security | BCrypt |
| QR Generation | ZXing 3.5.3 |
| Validation | Jakarta Validation |
| Build | Apache Maven |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Frontend QR Support | `qrcode`, `html5-qrcode` / bundled QR utilities |
| Optional UI Scaffold | React 19, Vite, Tailwind CSS |

---

## System Architecture

```text
┌─────────────────────────────┐
│        Patient / Doctor     │
│        Web Browser          │
└──────────────┬──────────────┘
               │ HTTP / JSON
               ▼
┌─────────────────────────────┐
│      Static Frontend        │
│  HTML + CSS + Vanilla JS    │
│       /frontend              │
└──────────────┬──────────────┘
               │ REST API
               ▼
┌─────────────────────────────┐
│       Spring Boot API       │
│                             │
│ Auth  Patient  Doctor  QR   │
│  │      │       │     │     │
│  └──────┴───────┴─────┘     │
│      Services / DTOs        │
│      Security / JWT         │
└──────────────┬──────────────┘
               │ JPA / Hibernate
               ▼
┌─────────────────────────────┐
│          MySQL              │
│                             │
│ Users                       │
│ Patients                    │
│ Doctors                     │
│ Medical Records             │
│ Prescriptions               │
│ Medicines                   │
│ Allergies                   │
└─────────────────────────────┘
```

---

## Project Structure

```text
MediFlow/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/MediFlow/
│       │   ├── config/          # Web/CORS configuration
│       │   ├── controller/      # REST controllers
│       │   ├── dto/             # Request/response DTOs
│       │   ├── entity/          # JPA entities
│       │   ├── exception/       # Custom exceptions + global handler
│       │   ├── repository/      # Spring Data repositories
│       │   ├── security/        # JWT and Spring Security components
│       │   └── service/         # Business logic
│       └── resources/
│           ├── application.properties
│           ├── schema.sql
│           └── data.sql
│
├── frontend/
│   ├── index.html
│   ├── patient-register.html
│   ├── patient-login.html
│   ├── patient-dashboard.html
│   ├── patient-profile.html
│   ├── medical-history.html
│   ├── patient-qr.html
│   ├── doctor-register.html
│   ├── doctor-login.html
│   ├── doctor-dashboard.html
│   ├── patient-record.html
│   ├── add-consultation.html
│   ├── css/style.css
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── patient.js
│       └── doctor.js
│
├── src/                         # Minimal Vite/React scaffold
├── package.json
├── vite.config.ts
├── .env.example
├── .gitignore
└── README.md
```

---

## Data Model

The backend uses seven main tables/entities:

```text
User
├── Patient
│   ├── Allergy (1:N)
│   └── MedicalRecord (1:N)
│       └── Prescription (1:1)
│           └── Medicine (1:N)
│
└── Doctor
    └── MedicalRecord (1:N)
```

### Tables

| Table | Purpose |
|---|---|
| `users` | Shared authentication identity and role information |
| `patients` | Patient-specific demographic data and unique QR token |
| `doctors` | Doctor specialization and hospital/clinic information |
| `medical_records` | Consultation history and clinical notes |
| `prescriptions` | Prescription metadata linked to a medical record |
| `medicines` | Medicines, dosage, frequency, duration, instructions |
| `allergies` | Patient allergy information |

---

## REST API

The backend runs with the `/api` base path.

### Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/patient/register` | Public | Register a patient |
| `POST` | `/api/auth/doctor/register` | Public | Register a doctor |
| `POST` | `/api/auth/login` | Public | Authenticate and obtain JWT |

### Patient

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| `GET` | `/api/patient/profile` | Patient | Get authenticated patient profile |
| `GET` | `/api/patient/history` | Patient | Get patient's medical history |
| `GET` | `/api/patient/prescriptions` | Patient | Get patient's prescriptions |
| `GET` | `/api/patient/medicines` | Patient | Get patient's medicines |
| `GET` | `/api/patient/qr` | Patient | Generate/retrieve patient QR details |

### Doctor

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| `GET` | `/api/doctor/patient/{id}` | Doctor | Get patient profile by ID |
| `GET` | `/api/doctor/patient-by-token/{token}` | Doctor | Find patient using QR token |
| `GET` | `/api/doctor/patient/{id}/history` | Doctor | Get patient medical history |
| `POST` | `/api/doctor/consultation` | Doctor | Create a new consultation |

### QR

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/qr/{token}` | Public | Resolve a QR token |
| `GET` | `/api/qr/image/{token}` | Public | Generate QR code as PNG |

> API access is enforced using role authorities such as `ROLE_PATIENT` and `ROLE_DOCTOR` for protected routes. QR resolution endpoints are intentionally public in the current implementation and therefore require additional production hardening before real patient data is used.

---

## Local Development Setup

### Prerequisites

Install the following:

- Java 17 or newer
- Maven 3.8+
- MySQL 8.0+
- A modern web browser
- Optional: Node.js/npm if you want to work with the Vite/React scaffold

Verify the installations:

```bash
java -version
mvn -version
mysql --version
```

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_REPOSITORY_DIRECTORY>
```

### 2. Create the Database

The application is configured to create the database when the MySQL connection is initialized, but creating it explicitly is recommended for local development:

```sql
CREATE DATABASE IF NOT EXISTS MediFlow_db;
```

### 3. Configure Database Credentials

Update `backend/src/main/resources/application.properties` or provide environment variables.

Recommended environment variables:

```bash
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

The JDBC URL is configured for a local MySQL instance:

```text
jdbc:mysql://localhost:3306/MediFlow_db
```

### 4. Start the Backend

```bash
cd backend
mvn clean spring-boot:run
```

The API starts on:

```text
http://localhost:8080
```

### 5. Start the Frontend

The repository's documented frontend is the static application in `frontend/`.

Using Python:

```bash
cd frontend
python3 -m http.server 3000
```

Open:

```text
http://localhost:3000/index.html
```

Alternatively, serve `frontend/` through VS Code Live Server, Nginx, Apache, or another static HTTP server.

---

## Demo Accounts

The repository includes seed/demo records in `backend/src/main/resources/data.sql`.

All seeded demo accounts use the sample password:

```text
password123
```

| Role | Email | Purpose |
|---|---|---|
| Patient | `john.doe@example.com` | Patient dashboard/history demo |
| Patient | `jane.smith@example.com` | Second patient example |
| Doctor | `sarah.jenkins@hospital.org` | Doctor/consultation demo |
| Doctor | `robert.vance@clinic.org` | Second doctor example |

**Do not reuse these credentials in any real deployment.**

---

## Typical User Flow

### Patient Flow

```text
Register / Login
      ↓
View Profile
      ↓
View Medical History
      ↓
View Prescriptions & Medicines
      ↓
View / Print QR Pass
```

### Doctor Flow

```text
Register / Login
      ↓
Enter or resolve patient QR token
      ↓
Review patient profile + allergies
      ↓
Review historical consultations
      ↓
Create new consultation
      ↓
Add prescription + medicines
      ↓
New record is appended to history
```

---

## Example API Request

### Doctor: Add Consultation

```http
POST /api/doctor/consultation
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

```json
{
  "patientId": 1,
  "diagnosis": "Routine follow-up",
  "symptoms": "No acute complaints",
  "notes": "Continue current treatment and follow-up as scheduled",
  "medicines": [
    {
      "medicineName": "Example Medicine",
      "dosage": "5 mg",
      "frequency": "Once daily",
      "duration": "30 days",
      "instructions": "Take after breakfast"
    }
  ]
}
```

The service creates a new medical record and, when medicines are included, a new prescription and medicine entries linked to that record.

---

## Security & Privacy Notes

MediFlow contains security-oriented building blocks, but the current repository configuration is intended for development/demo use.

Before any real deployment, at minimum:

1. **Replace the JWT secret** with a strong secret supplied through a secure secret manager or environment variable.
2. **Restrict CORS** to trusted application origins instead of wildcard origins.
3. **Disable automatic demo-data initialization** in production.
4. **Remove demo credentials and sample patient data** from production builds.
5. **Use HTTPS/TLS** for all browser-to-server traffic.
6. **Review QR token exposure** and consider authenticated, short-lived, revocable access tokens instead of exposing patient information through public QR endpoints.
7. Add audit logging, rate limiting, monitoring, secure session/token storage, backup/restore controls, and a formal privacy/compliance review appropriate to the deployment jurisdiction.
8. Avoid storing sensitive personal or medical information in browser `localStorage` for production use.

These controls are especially important because medical records and QR tokens can contain or provide access to sensitive personal information.

---

## Database Initialization Notes

The backend currently uses both:

- `schema.sql` for database/table initialization
- `data.sql` for demo/seed data
- Hibernate with `spring.jpa.hibernate.ddl-auto=update`

The current development configuration also enables SQL initialization on startup.

For a production environment, database migrations should be managed explicitly with a migration strategy such as Flyway or Liquibase rather than relying on automatic schema updates and demo seed data.

---

## Frontend Demo Mode

The static frontend includes a localStorage-backed demo data layer in `frontend/js/api.js`. This allows parts of the UI to be explored without a running backend.

For a real application environment, the Spring Boot API and MySQL database should be treated as the source of truth.

---

## Testing

The current repository does not contain a dedicated automated test suite under `src/test`.

For a production-quality release, add:

- Unit tests for services and security components
- Controller/API integration tests
- Repository/database integration tests
- Authentication and authorization tests
- QR token validation tests
- Regression tests for append-only medical record behavior
- Frontend end-to-end tests

---

## Production Readiness Checklist

```text
[ ] Externalize and rotate JWT secret
[ ] Restrict CORS origins
[ ] Disable demo seed data
[ ] Disable automatic schema updates
[ ] Add database migrations
[ ] Remove demo credentials/data
[ ] Enforce HTTPS
[ ] Add rate limiting and audit logs
[ ] Harden QR access and token revocation
[ ] Add automated tests
[ ] Add application monitoring and backups
[ ] Perform privacy/security/compliance review
```

---

## Contributing

Contributions are welcome.

A typical workflow is:

```bash
git checkout -b feature/your-feature
git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature
```

Then open a pull request with a clear description of the change and any relevant testing notes.

---

## License

No license file is currently included in the repository.

---

## Project Status

**Status:** Development / Prototype

The project demonstrates the core workflow for QR-based patient identification and append-only medical history management. It is suitable for learning, demonstrations, academic projects, and further development.

---

## Maintainer

**Sagar Kushalapur**

For repository-specific questions, open an issue in the GitHub repository.
