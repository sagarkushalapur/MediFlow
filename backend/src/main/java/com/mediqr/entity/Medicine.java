package com.mediqr.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "medicines")
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false, updatable = false)
    private Prescription prescription;

    @Column(name = "medicine_name", nullable = false, length = 150, updatable = false)
    private String medicineName;

    @Column(nullable = false, length = 100, updatable = false)
    private String dosage;

    @Column(nullable = false, length = 100, updatable = false)
    private String frequency;

    @Column(nullable = false, length = 100, updatable = false)
    private String duration;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String instructions;

    public Medicine() {
    }

    public Medicine(Prescription prescription, String medicineName, String dosage, String frequency, String duration, String instructions) {
        this.prescription = prescription;
        this.medicineName = medicineName;
        this.dosage = dosage;
        this.frequency = frequency;
        this.duration = duration;
        this.instructions = instructions;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Prescription getPrescription() {
        return prescription;
    }

    public void setPrescription(Prescription prescription) {
        this.prescription = prescription;
    }

    public String getMedicineName() {
        return medicineName;
    }

    public void setMedicineName(String medicineName) {
        this.medicineName = medicineName;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }
}
