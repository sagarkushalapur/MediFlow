# MediFlow – Secure QR-Based Patient Medical History System

A full-stack, enterprise-grade medical records management system built with **Java 17, Spring Boot, Spring Data JPA, Hibernate, Spring Security, MySQL, ZXing**, and a clean, responsive **HTML5 / CSS3 / Plain JavaScript** frontend.

---

## 🔒 Core Architectural Rule

- **Patients CANNOT edit or delete medical records.**
- **Doctors CAN add new medical records but CANNOT edit or delete old records.**
- Every consultation is permanently appended as a new historical record with timestamp, doctor identity, clinical notes, and prescriptions.
- **OLD MEDICAL RECORDS MUST NEVER BE OVERWRITTEN.**

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Backend Framework** | Spring Boot 3.2.3 | REST API architecture, Dependency Injection |
| **Java Version** | Java 17+ | Long Term Support (LTS) OOP standard |
| **Data Persistence** | Spring Data JPA / Hibernate | Object-Relational Mapping (ORM) |
| **Database** | MySQL 8.0+ | Relational schema with foreign keys and indexes |
| **Security & Auth** | Spring Security 6 + BCrypt + JWT | Role-based authorization (`ROLE_PATIENT`, `ROLE_DOCTOR`) |
| **QR Code Engine** | ZXing (Zebra Crossing) 3.5.3 | High-density QR code generation to PNG & Base64 |
| **Build Tool** | Apache Maven | Dependency management & compilation |
| **Frontend** | HTML5, CSS3, Plain JavaScript | Responsive healthcare design, zero JS/CSS frameworks |

---

## 📁 Project Directory Structure

```text
mediqr/
│
├── backend/
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/
│           │   └── com/
│           │       └── mediqr/
│           │           ├── MediqrApplication.java
│           │           ├── config/
│           │           │   └── WebConfig.java
│           │           ├── controller/
│           │           │   ├── AuthController.java
│           │           │   ├── PatientController.java
│           │           │   ├── DoctorController.java
│           │           │   └── QrController.java
│           │           ├── dto/
│           │           │   ├── ApiResponse.java
│           │           │   ├── AuthResponse.java
│           │           │   ├── LoginRequest.java
│           │           │   ├── PatientRegisterRequest.java
│           │           │   ├── DoctorRegisterRequest.java
│           │           │   ├── PatientProfileResponse.java
│           │           │   ├── MedicalRecordResponse.java
│           │           │   ├── PrescriptionResponse.java
│           │           │   ├── MedicineResponse.java
│           │           │   ├── AllergyResponse.java
│           │           │   ├── ConsultationRequest.java
│           │           │   ├── MedicineItemRequest.java
│           │           │   └── QrResponse.java
│           │           ├── entity/
│           │           │   ├── User.java
│           │           │   ├── Role.java
│           │           │   ├── Patient.java
│           │           │   ├── Doctor.java
│           │           │   ├── MedicalRecord.java
│           │           │   ├── Prescription.java
│           │           │   ├── Medicine.java
│           │           │   └── Allergy.java
│           │           ├── exception/
│           │           │   ├── BadRequestException.java
│           │           │   ├── ResourceNotFoundException.java
│           │           │   ├── UnauthorizedException.java
│           │           │   └── GlobalExceptionHandler.java
│           │           ├── repository/
│           │           │   ├── UserRepository.java
│           │           │   ├── PatientRepository.java
│           │           │   ├── DoctorRepository.java
│           │           │   ├── MedicalRecordRepository.java
│           │           │   ├── PrescriptionRepository.java
│           │           │   ├── MedicineRepository.java
│           │           │   └── AllergyRepository.java
│           │           ├── security/
│           │           │   ├── CustomUserDetails.java
│           │           │   ├── CustomUserDetailsService.java
│           │           │   ├── JwtAuthFilter.java
│           │           │   ├── JwtUtils.java
│           │           │   └── SecurityConfig.java
│           │           └── service/
│           │               ├── AuthService.java
│           │               ├── DoctorService.java
│           │               ├── PatientService.java
│           │               └── QrService.java
│           └── resources/
│               ├── application.properties
│               ├── schema.sql
│               └── data.sql
│
├── frontend/
│   ├── index.html                  # Landing page & test portal
│   ├── patient-register.html       # Patient registration form
│   ├── patient-login.html          # Patient authentication
│   ├── doctor-register.html        # Doctor registration form
│   ├── doctor-login.html           # Doctor authentication
│   ├── patient-dashboard.html      # Patient dashboard & stats
│   ├── patient-profile.html        # Patient demographics & allergies
│   ├── medical-history.html        # Patient view of historical records
│   ├── patient-qr.html             # High-resolution QR code & print pass
│   ├── doctor-dashboard.html       # Doctor desk & QR scanner/lookup
│   ├── patient-record.html         # Verified patient history (doctor view)
│   ├── add-consultation.html       # Dynamic diagnosis & prescription form
│   ├── css/
│   │   └── style.css               # Clean healthcare design system
│   └── js/
│       ├── api.js                  # REST API client & dual-mode fallback
│       ├── auth.js                 # Authentication & navigation handler
│       ├── patient.js              # Patient modules & timeline renderer
│       └── doctor.js               # Doctor modules & dynamic prescription builder
│
└── README.md
```

---

## 🗄️ Database Design (MySQL)

### Schema DDL (`schema.sql`)

```sql
CREATE DATABASE IF NOT EXISTS mediqr_db;
USE mediqr_db;

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Patients
CREATE TABLE IF NOT EXISTS patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    qr_token VARCHAR(100) NOT NULL UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Doctors
CREATE TABLE IF NOT EXISTS doctors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    specialization VARCHAR(100) NOT NULL,
    hospital_name VARCHAR(150) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Medical Records (IMMUTABLE)
CREATE TABLE IF NOT EXISTS medical_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    diagnosis VARCHAR(255) NOT NULL,
    symptoms TEXT,
    notes TEXT,
    visit_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medical_record_id BIGINT NOT NULL UNIQUE,
    prescription_date DATE NOT NULL,
    FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Medicines
CREATE TABLE IF NOT EXISTS medicines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    instructions TEXT,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Allergies
CREATE TABLE IF NOT EXISTS allergies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    allergy_name VARCHAR(100) NOT NULL,
    description TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_patients_qr ON patients(qr_token);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
```

### Entity Relationships

- **One User** &rarr; **One Patient** OR **One Doctor**
- **One Patient** &rarr; **Many Medical Records**
- **One Doctor** &rarr; **Many Medical Records**
- **One Medical Record** &rarr; **One Prescription**
- **One Prescription** &rarr; **Many Medicines**
- **One Patient** &rarr; **Many Allergies**
- **One Patient** &rarr; **One Unique Cryptographic QR Token**

---

## 🚀 Setup & Execution Guide

### 1. Install Required Software
Ensure you have the following installed on your machine:
- **Java 17 JDK or higher** (`java -version`)
- **Apache Maven 3.8+** (`mvn -version`)
- **MySQL Server 8.0+** (`mysql -u root -p`)

### 2. Configure MySQL Database
Start your MySQL server and initialize the database:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS mediqr_db;"
```

The Spring Boot backend is configured with `spring.sql.init.mode=always` and `defer-datasource-initialization=true`, so executing `schema.sql` and `data.sql` will happen automatically upon first boot. Alternatively, you can run them manually:

```bash
mysql -u root -p mediqr_db < backend/src/main/resources/schema.sql
mysql -u root -p mediqr_db < backend/src/main/resources/data.sql
```

### 3. Configure `application.properties`
Check `backend/src/main/resources/application.properties` and update your MySQL credentials:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/mediqr_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=your_mysql_password
```

### 4. Run Spring Boot Backend
Navigate to the `backend/` directory and run:

```bash
cd backend
mvn clean spring-boot:run
```

The Spring Boot backend will start on **`http://localhost:8080`**.

### 5. Run the Frontend
You can serve the `frontend/` directory using any HTTP static server, for example:

**Option A (Python 3):**
```bash
cd frontend
python3 -m http.server 3000
```

**Option B (Live Server / Nginx / Apache):**
Open `frontend/index.html` in VS Code with "Live Server" or place it under your web server root.

Visit: **`http://localhost:3000/index.html`**

---

## 🧪 Demo Test Accounts

Both accounts use password: `password123`

| Role | Name | Email | Additional Details |
|---|---|---|---|
| **Patient** | John Doe | `john.doe@example.com` | Blood: **O+**, Token: `MEDIQR-PAT-8831-ABCD`, Allergies: **Penicillin, Peanuts** |
| **Patient** | Jane Smith | `jane.smith@example.com` | Blood: **B+**, Token: `MEDIQR-PAT-9520-EFGH`, Allergies: **Sulfa Drugs** |
| **Doctor** | Dr. Sarah Jenkins | `sarah.jenkins@hospital.org` | Specialization: **Cardiology**, Hospital: **Metro General Heart Center** |
| **Doctor** | Dr. Robert Vance | `robert.vance@clinic.org` | Specialization: **Internal Medicine & GP**, Hospital: **City Health Clinic** |

---

## 📋 End-to-End Workflow Verification

1. **Patient Registration:**
   - Go to `patient-register.html`
   - Fill in details, DOB, blood group, allergies
   - Submit &rarr; A unique QR token (e.g., `MEDIQR-PAT-XXXX-XXXX`) is automatically generated.
2. **View Patient Pass:**
   - Go to `patient-qr.html`
   - View the generated ZXing QR code, print card, or copy token.
3. **Doctor Login & QR Scan:**
   - Go to `doctor-login.html` and sign in as `sarah.jenkins@hospital.org`.
   - On `doctor-dashboard.html`, enter token `MEDIQR-PAT-8831-ABCD` or click the one-click demo button.
4. **Inspect Medical History:**
   - Notice the prominent allergy warning: **"⚠️ Penicillin (Anaphylactic rash)"**.
   - Review past visits (e.g. Viral Bronchitis treated with Azithromycin by Dr. Vance).
5. **Add New Consultation:**
   - Click **"Add New Consultation"**.
   - Enter diagnosis (e.g. "Mild Arrhythmia follow-up").
   - Click **"+ Add Another Medicine"** to prescribe medication with dosage and duration.
   - Click **"Save Consultation Permanently"**.
6. **Verify Record Immutability:**
   - The new consultation appears at the top of the history timeline with today's date and Dr. Jenkins's signature.
   - The previous consultation by Dr. Vance is intact and unchanged.
   - No edit or delete buttons exist for either doctor or patient.
