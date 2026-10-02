package com.mediqr.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medical_records")
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false, updatable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false, updatable = false)
    private Doctor doctor;

    @Column(nullable = false, length = 255, updatable = false)
    private String diagnosis;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String symptoms;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String notes;

    @Column(name = "visit_date", nullable = false, updatable = false)
    private LocalDate visitDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "medicalRecord", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = false)
    private Prescription prescription;

    public MedicalRecord() {
    }

    public MedicalRecord(Patient patient, Doctor doctor, String diagnosis, String symptoms, String notes, LocalDate visitDate) {
        this.patient = patient;
        this.doctor = doctor;
        this.diagnosis = diagnosis;
        this.symptoms = symptoms;
        this.notes = notes;
        this.visitDate = visitDate;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.visitDate == null) {
            this.visitDate = LocalDate.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public Doctor getDoctor() {
        return doctor;
    }

    public void setDoctor(Doctor doctor) {
        this.doctor = doctor;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(String symptoms) {
        this.symptoms = symptoms;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDate getVisitDate() {
        return visitDate;
    }

    public void setVisitDate(LocalDate visitDate) {
        this.visitDate = visitDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Prescription getPrescription() {
        return prescription;
    }

    public void setPrescription(Prescription prescription) {
        this.prescription = prescription;
    }
}
