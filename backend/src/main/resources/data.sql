-- MediQR: Sample Demo Data
-- BCrypt password for both doctor & patient demo accounts is 'password123'
-- Hash: $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi

-- Insert Users
-- ID 1: Patient John Doe
INSERT INTO users (id, name, email, password, role, created_at)
VALUES (1, 'John Doe', 'john.doe@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'ROLE_PATIENT', NOW());

-- ID 2: Doctor Sarah Jenkins
INSERT INTO users (id, name, email, password, role, created_at)
VALUES (2, 'Dr. Sarah Jenkins', 'sarah.jenkins@hospital.org', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'ROLE_DOCTOR', NOW());

-- ID 3: Doctor Robert Vance
INSERT INTO users (id, name, email, password, role, created_at)
VALUES (3, 'Dr. Robert Vance', 'robert.vance@clinic.org', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'ROLE_DOCTOR', NOW());

-- ID 4: Patient Jane Smith
INSERT INTO users (id, name, email, password, role, created_at)
VALUES (4, 'Jane Smith', 'jane.smith@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'ROLE_PATIENT', NOW());

-- Insert Patients
INSERT INTO patients (id, user_id, date_of_birth, gender, blood_group, phone, address, qr_token)
VALUES (1, 1, '1988-05-14', 'Male', 'O+', '+1 (555) 234-5678', '742 Evergreen Terrace, Springfield', 'MEDIQR-PAT-8831-ABCD');

INSERT INTO patients (id, user_id, date_of_birth, gender, blood_group, phone, address, qr_token)
VALUES (2, 4, '1995-11-20', 'Female', 'B+', '+1 (555) 876-5432', '1204 Elm Street, Riverdale', 'MEDIQR-PAT-9520-EFGH');

-- Insert Doctors
INSERT INTO doctors (id, user_id, specialization, hospital_name)
VALUES (1, 2, 'Cardiology', 'Metro General Heart Center');

INSERT INTO doctors (id, user_id, specialization, hospital_name)
VALUES (2, 3, 'Internal Medicine & General Practice', 'City Health Diagnostic Clinic');

-- Insert Allergies
INSERT INTO allergies (id, patient_id, allergy_name, description)
VALUES (1, 1, 'Penicillin', 'Causes severe anaphylactic rash and facial swelling');

INSERT INTO allergies (id, patient_id, allergy_name, description)
VALUES (2, 1, 'Peanuts', 'Moderate respiratory wheezing and hives');

INSERT INTO allergies (id, patient_id, allergy_name, description)
VALUES (3, 2, 'Sulfa Drugs', 'Mild hives and skin itching');

-- Insert Historical Medical Records for John Doe (Patient 1)
-- Record 1: Diagnosed by Dr. Robert Vance
INSERT INTO medical_records (id, patient_id, doctor_id, diagnosis, symptoms, notes, visit_date, created_at)
VALUES (1, 1, 2, 'Acute Viral Bronchitis', 'Persistent dry cough, mild fever 100.4F, chest discomfort for 4 days', 'Patient advised warm hydration, rest. Non-smoker. Monitor temp.', '2024-01-15', '2024-01-15 10:30:00');

-- Record 2: Diagnosed by Dr. Sarah Jenkins (Cardiology visit)
INSERT INTO medical_records (id, patient_id, doctor_id, diagnosis, symptoms, notes, visit_date, created_at)
VALUES (2, 1, 1, 'Essential Hypertension (Stage 1)', 'Occasional occipital morning headaches, fatigue, blood pressure reading 142/92 mmHg', 'ECG within normal limits. Commenced low-dose antihypertensive therapy. Sodium restriction advised.', '2024-04-10', '2024-04-10 14:15:00');

-- Insert Prescriptions
INSERT INTO prescriptions (id, medical_record_id, prescription_date)
VALUES (1, 1, '2024-01-15');

INSERT INTO prescriptions (id, medical_record_id, prescription_date)
VALUES (2, 2, '2024-04-10');

-- Insert Medicines for Prescription 1 (Bronchitis)
INSERT INTO medicines (id, prescription_id, medicine_name, dosage, frequency, duration, instructions)
VALUES (1, 1, 'Azithromycin', '500mg', 'Once daily', '5 days', 'Take 1 hour before or 2 hours after meals with full glass of water');

INSERT INTO medicines (id, prescription_id, medicine_name, dosage, frequency, duration, instructions)
VALUES (2, 1, 'Dextromethorphan HBr', '10ml', 'Every 8 hours as needed', '7 days', 'Take after meals. Avoid driving if drowsy.');

-- Insert Medicines for Prescription 2 (Hypertension)
INSERT INTO medicines (id, prescription_id, medicine_name, dosage, frequency, duration, instructions)
VALUES (3, 2, 'Amlodipine Besylate', '5mg', 'Once daily in the morning', '30 days', 'Take with or without food. Avoid grapefruit juice.');

INSERT INTO medicines (id, prescription_id, medicine_name, dosage, frequency, duration, instructions)
VALUES (4, 2, 'Omega-3 Fish Oil', '1000mg', 'Once daily with lunch', '60 days', 'Dietary cardiovascular support.');
